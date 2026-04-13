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
  const [settling, setSettling]     = useState(false);

  /* ── Build the merged user object from DB profile rows ── */
  async function fetchProfile(authUser) {
    if (!authUser) { setUser(null); setActiveRole(null); return; }

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // Trigger may have missed — create rows from OAuth metadata as fallback
    if (!profile) {
      const meta  = authUser.user_metadata || {};
      const role  = meta.role || localStorage.getItem('ogisback_pending_role') || 'creator';
      const name  = meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User';

      await supabase.from('profiles').upsert(
        { id: authUser.id, role, plan: 'free', profile_complete: false },
        { onConflict: 'id' }
      );

      if (role === 'creator') {
        const username = (authUser.email?.split('@')[0] ?? 'user')
          .replace(/[^a-z0-9]/gi, '').toLowerCase()
          + Math.floor(Math.random() * 9000 + 1000);
        await supabase.from('creator_profiles').upsert(
          { id: authUser.id, username, name },
          { onConflict: 'id' }
        );
      } else {
        const slug = name.toLowerCase().replace(/\s+/g, '-')
          + Math.floor(Math.random() * 9000 + 1000);
        await supabase.from('brand_profiles').upsert(
          { id: authUser.id, slug, name },
          { onConflict: 'id' }
        );
      }

      const { data: fresh } = await supabase
        .from('profiles').select('*').eq('id', authUser.id).single();
      profile = fresh;
    }

    if (!profile) { setUser(null); setActiveRole(null); return; }

    // Mark user as online
    supabase.from('profiles').update({
      is_online: true,
      last_seen: new Date().toISOString(),
    }).eq('id', authUser.id);

    const role = profile.role;
    let subProfile = null;

    if (role === 'creator') {
      const { data } = await supabase.from('creator_profiles').select('*').eq('id', authUser.id).single();
      subProfile = data;
    } else if (role === 'brand') {
      const { data } = await supabase.from('brand_profiles').select('*').eq('id', authUser.id).single();
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

  /* ── OAuth sign-in (the only auth methods) ── */

  // Google → brand dashboard (role is always 'brand' for Google)
  const signInWithGoogle = async () => {
    localStorage.setItem('ogisback_pending_role', 'brand');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
  };

  // Instagram → creator dashboard (role is always 'creator' for Instagram)
  const signInWithInstagram = async () => {
    localStorage.setItem('ogisback_pending_role', 'creator');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'public_profile,email',
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
    signInWithInstagram,
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
