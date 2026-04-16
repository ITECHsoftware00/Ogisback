import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('ogisback_dark') === 'true');
  const [loading, setLoading]       = useState(true);
  // settling = true while fetchProfile is running after SIGNED_IN
  // If the page loaded with ?code= (OAuth callback), start as settling so
  // AuthCallback waits for SIGNED_IN before deciding where to route.
  const [settling, setSettling] = useState(
    () => new URLSearchParams(window.location.search).has('code')
  );

  /* ── Build the merged user object from DB profile rows ── */
  async function fetchProfile(authUser) {
    if (!authUser) { setUser(null); setActiveRole(null); return; }

    try {
      // ── 1. Read existing profile ──
      let { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileErr && profileErr.code !== 'PGRST116') {
        // PGRST116 = "no rows" — anything else is a real DB error
        console.error('[fetchProfile] profiles read error:', profileErr);
      }

      // ── 2. Create profile rows if missing (trigger may have not run) ──
      if (!profile) {
        const meta = authUser.user_metadata || {};
        const role = meta.role
          || localStorage.getItem('ogisback_pending_role')
          || 'creator';
        const name = meta.full_name || meta.name
          || authUser.email?.split('@')[0]
          || 'User';

        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert(
            { id: authUser.id, role, plan: 'free', profile_complete: false },
            { onConflict: 'id' }
          );
        if (upsertErr) console.error('[fetchProfile] profiles upsert error:', upsertErr);

        if (role === 'creator') {
          const username = (authUser.email?.split('@')[0] ?? 'user')
            .replace(/[^a-z0-9]/gi, '').toLowerCase()
            + Math.floor(Math.random() * 9000 + 1000);
          const { error: cpErr } = await supabase
            .from('creator_profiles')
            .upsert({ id: authUser.id, username, name }, { onConflict: 'id' });
          if (cpErr) console.error('[fetchProfile] creator_profiles upsert error:', cpErr);
        } else {
          const slug = name.toLowerCase().replace(/\s+/g, '-')
            + Math.floor(Math.random() * 9000 + 1000);
          const { error: bpErr } = await supabase
            .from('brand_profiles')
            .upsert({ id: authUser.id, slug, name }, { onConflict: 'id' });
          if (bpErr) console.error('[fetchProfile] brand_profiles upsert error:', bpErr);
        }

        const { data: fresh, error: freshErr } = await supabase
          .from('profiles').select('*').eq('id', authUser.id).single();
        if (freshErr) console.error('[fetchProfile] profiles re-read error:', freshErr);
        profile = fresh;
      }

      // ── 3. Fallback: if DB is unreachable, still log user in with minimal data ──
      if (!profile) {
        console.warn('[fetchProfile] profile still null after upsert — using fallback');
        const fallbackRole = localStorage.getItem('ogisback_pending_role') || 'creator';
        setUser({
          id: authUser.id,
          email: authUser.email,
          role: fallbackRole,
          plan: 'free',
          profileComplete: false,
          name: authUser.email?.split('@')[0] || 'User',
        });
        setActiveRole(fallbackRole);
        return;
      }

      // ── 4. Mark online (fire-and-forget) ──
      supabase.from('profiles').update({
        is_online: true,
        last_seen: new Date().toISOString(),
      }).eq('id', authUser.id);

      // ── 5. Load sub-profile ──
      const role = profile.role;
      let subProfile = null;

      if (role === 'creator') {
        const { data, error } = await supabase
          .from('creator_profiles').select('*').eq('id', authUser.id).single();
        if (error && error.code !== 'PGRST116')
          console.error('[fetchProfile] creator_profiles read error:', error);
        subProfile = data;
      } else if (role === 'brand') {
        const { data, error } = await supabase
          .from('brand_profiles').select('*').eq('id', authUser.id).single();
        if (error && error.code !== 'PGRST116')
          console.error('[fetchProfile] brand_profiles read error:', error);
        subProfile = data;
      }

      setUser({
        id: authUser.id,
        email: authUser.email,
        role,
        plan: profile.plan,
        profileComplete: profile.profile_complete,
        darkMode: profile.dark_mode,
        name: subProfile?.name || authUser.email,
        username: subProfile?.username || null,
        avatar: subProfile?.avatar_url || null,
        logo: subProfile?.logo_url || null,
        slug: subProfile?.slug || null,
        walletBalance: subProfile?.wallet_balance || 0,
        pendingBalance: subProfile?.pending_balance || 0,
        ...subProfile,
      });
      setActiveRole(role);

    } catch (err) {
      // Last-resort fallback — never leave the user stuck on the spinner
      console.error('[fetchProfile] unexpected error:', err);
      const fallbackRole = localStorage.getItem('ogisback_pending_role') || 'creator';
      setUser({
        id: authUser.id,
        email: authUser.email,
        role: fallbackRole,
        plan: 'free',
        profileComplete: false,
        name: authUser.email?.split('@')[0] || 'User',
      });
      setActiveRole(fallbackRole);
    }
  }

  /* ── Auth state listener — OAuth events only ── */
  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setSettling(true);
        fetchProfile(session.user).then(() => {
          localStorage.removeItem('ogisback_pending_role');
        }).finally(() => setSettling(false));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setActiveRole(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Silently refresh — no profile re-fetch needed, just update session
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ── Dark mode sync ── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ogisback_dark', darkMode);
  }, [darkMode]);

  /* ── Email auth ── */

  const signUpWithEmail = async (email, password, role = 'creator') => {
    localStorage.setItem('ogisback_pending_role', role);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role }, // passed into raw_user_meta_data so the DB trigger reads it
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const resendConfirmation = async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  /* ── OAuth sign-in ── */

  const signInWithGoogle = async (role = 'brand') => {
    localStorage.setItem('ogisback_pending_role', role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
  };

  const signInWithFacebook = async (role = 'creator') => {
    localStorage.setItem('ogisback_pending_role', role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // email must be listed first; public_profile is always granted
        scopes: 'email,public_profile',
      },
    });
    if (error) throw error;
  };

  // Called from AuthCallback for new OAuth users who need a profile created
  const setupOAuthProfile = async (userId, email, role, name) => {
    await supabase.from('profiles').upsert(
      { id: userId, role, plan: 'free', profile_complete: false },
      { onConflict: 'id' }
    );
    if (role === 'creator') {
      const username = (email.split('@')[0]).replace(/[^a-z0-9]/gi, '').toLowerCase()
        + Math.floor(Math.random() * 9000 + 1000);
      await supabase.from('creator_profiles').upsert(
        { id: userId, username, name },
        { onConflict: 'id' }
      );
    } else {
      const slug = name.toLowerCase().replace(/\s+/g, '-')
        + Math.floor(Math.random() * 9000 + 1000);
      await supabase.from('brand_profiles').upsert(
        { id: userId, slug, name },
        { onConflict: 'id' }
      );
    }
    await fetchProfile({ id: userId, email });
  };

  const logout = async () => {
    if (user?.id) {
      await supabase.from('profiles').update({
        is_online: false,
        last_seen: new Date().toISOString(),
      }).eq('id', user.id);
    }
    await supabase.auth.signOut();
    // SIGNED_OUT event will clear user state via onAuthStateChange
  };

  const completeProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ profile_complete: true }).eq('id', user.id);
    setUser(u => ({ ...u, profileComplete: true }));
  };

  const upgradePlan = async (plan) => {
    if (!user) return;
    await supabase.from('profiles').update({ plan }).eq('id', user.id);
    setUser(u => ({ ...u, plan }));
  };

  const switchRole = (role) => setActiveRole(role);
  const toggleDark = () => setDarkMode(d => !d);

  /* ── Demo accounts (bypasses OAuth — mock data only) ── */
  const loginAsCreator = () => {
    setUser({ id: 'mock-c1', name: 'Sarah Chen', role: 'creator', plan: 'free', profileComplete: true, walletBalance: 3120, pendingBalance: 2240, avatar: 'https://i.pravatar.cc/150?img=47' });
    setActiveRole('creator');
  };
  const loginAsBrand = () => {
    setUser({ id: 'mock-b1', name: 'NovaSkin', role: 'brand', plan: 'free', profileComplete: true, walletBalance: 15000, logo: 'https://i.pravatar.cc/150?img=20' });
    setActiveRole('brand');
  };
  const loginAsAdmin = () => {
    setUser({ id: 'mock-admin', name: 'Admin', email: 'admin@ogisback.com', role: 'admin', plan: 'free', profileComplete: true });
    setActiveRole('admin');
  };

  const value = {
    user,
    activeRole,
    darkMode,
    loading,
    settling,
    logout,
    signInWithGoogle,
    signInWithFacebook,
    signInWithInstagram: signInWithFacebook, // backwards-compat alias
    signInWithEmail,
    signUpWithEmail,
    resendConfirmation,
    resetPassword,
    setupOAuthProfile,
    completeProfile,
    upgradePlan,
    switchRole,
    toggleDark,
    loginAsCreator,
    loginAsBrand,
    loginAsAdmin,
    isCreator: activeRole === 'creator',
    isBrand:   activeRole === 'brand',
    isAdmin:   activeRole === 'admin',
    isLoggedIn: !!user,
    plan: user?.plan || 'free',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
