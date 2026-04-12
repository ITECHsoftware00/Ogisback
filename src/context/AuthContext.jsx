import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ogisback_dark') === 'true');
  const [loading, setLoading] = useState(true);

  /* ── Fetch full profile (profiles + creator/brand sub-profile) ── */
  async function fetchProfile(authUser) {
    if (!authUser) { setUser(null); setActiveRole(null); return; }

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // If no profile row yet (trigger may have missed), create one from metadata
    if (!profile) {
      const meta = authUser.user_metadata || {};
      const role = meta.role || 'creator';
      const name = meta.name || authUser.email.split('@')[0];
      await supabase.from('profiles').upsert(
        { id: authUser.id, role, plan: 'free', profile_complete: false },
        { onConflict: 'id' }
      );
      if (role === 'creator') {
        const username = authUser.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase()
          + Math.floor(Math.random() * 999);
        await supabase.from('creator_profiles').upsert(
          { id: authUser.id, username, name },
          { onConflict: 'id' }
        );
      } else {
        const slug = name.toLowerCase().replace(/\s+/g, '-') + Math.floor(Math.random() * 999);
        await supabase.from('brand_profiles').upsert(
          { id: authUser.id, slug, name },
          { onConflict: 'id' }
        );
      }
      const { data: newProfile } = await supabase
        .from('profiles').select('*').eq('id', authUser.id).single();
      profile = newProfile;
    }

    if (!profile) { setUser(null); setActiveRole(null); return; }

    const role = profile.role;
    let subProfile = null;

    if (role === 'creator') {
      const { data } = await supabase.from('creator_profiles').select('*').eq('id', authUser.id).single();
      subProfile = data;
    } else if (role === 'brand') {
      const { data } = await supabase.from('brand_profiles').select('*').eq('id', authUser.id).single();
      subProfile = data;
    }
    // admin role has no sub-profile

    const merged = {
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
    };

    setUser(merged);
    setActiveRole(role);
  }

  /* ── Listen to auth state changes ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user ?? null).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ── Dark mode sync ── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('ogisback_dark', darkMode);
  }, [darkMode]);

  /* ── Auth actions ── */

  const signup = async (email, password, role, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, name } },
    });
    if (error) throw error;

    // If Supabase auto-confirmed the session (email confirm disabled),
    // create profile rows immediately — don't rely solely on the DB trigger.
    if (data.session && data.user) {
      const uid = data.user.id;
      // Upsert is safe: if trigger already ran this is a no-op.
      await supabase.from('profiles').upsert({
        id: uid, role, plan: 'free', profile_complete: false,
      }, { onConflict: 'id' });

      if (role === 'creator') {
        const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase()
          + Math.floor(Math.random() * 999);
        await supabase.from('creator_profiles').upsert(
          { id: uid, username, name },
          { onConflict: 'id' }
        );
      } else {
        const slug = name.toLowerCase().replace(/\s+/g, '-') + Math.floor(Math.random() * 999);
        await supabase.from('brand_profiles').upsert(
          { id: uid, slug, name },
          { onConflict: 'id' }
        );
      }
    }

    // needsConfirmation = true when Supabase requires email verification
    return { ...data, needsConfirmation: !data.session };
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const forgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveRole(null);
  };

  /* ── OAuth sign-in ── */

  const signInWithGoogle = async (role = null) => {
    if (role) localStorage.setItem('ogisback_pending_role', role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  // Instagram uses Meta/Facebook OAuth under the hood
  const signInWithInstagram = async (role = null) => {
    if (role) localStorage.setItem('ogisback_pending_role', role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  // Called from AuthCallback when a new OAuth user needs to create their profile
  const setupOAuthProfile = async (userId, email, role, name) => {
    await supabase.from('profiles').upsert({ id: userId, role, plan: 'free', profile_complete: false });
    if (role === 'creator') {
      const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() + Math.floor(Math.random() * 999);
      await supabase.from('creator_profiles').upsert({ id: userId, username, name });
    } else {
      const slug = name.toLowerCase().replace(/\s+/g, '-') + Math.floor(Math.random() * 999);
      await supabase.from('brand_profiles').upsert({ id: userId, slug, name });
    }
    await fetchProfile({ id: userId, email });
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

  /* ── Demo accounts (dev only) ── */
  const loginAsCreator = () => login('sarah@example.com', 'password123').catch(() => {
    setUser({ id: 'mock-c1', name: 'Sarah Chen', role: 'creator', plan: 'free', profileComplete: true, walletBalance: 3120, pendingBalance: 2240, avatar: 'https://i.pravatar.cc/150?img=47' });
    setActiveRole('creator');
  });
  const loginAsBrand = () => login('hello@novaskin.com', 'password123').catch(() => {
    setUser({ id: 'mock-b1', name: 'NovaSkin', role: 'brand', plan: 'free', profileComplete: true, walletBalance: 15000, logo: 'https://i.pravatar.cc/150?img=20' });
    setActiveRole('brand');
  });
  const loginAsAdmin = () => {
    setUser({ id: 'mock-admin', name: 'Admin', email: 'admin@ogisback.com', role: 'admin', plan: 'free', profileComplete: true });
    setActiveRole('admin');
  };

  const value = {
    user,
    activeRole,
    darkMode,
    loading,
    signup,
    login,
    logout,
    forgotPassword,
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
    isBrand: activeRole === 'brand',
    isAdmin: activeRole === 'admin',
    isLoggedIn: !!user,
    plan: user?.plan || 'free',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
