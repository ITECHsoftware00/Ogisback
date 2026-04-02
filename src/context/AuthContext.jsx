import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);         // Supabase auth user + profile merged
  const [activeRole, setActiveRole] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ogisback_dark') === 'true');
  const [loading, setLoading] = useState(true);

  /* ── Fetch full profile (profiles + creator/brand sub-profile) ── */
  async function fetchProfile(authUser) {
    if (!authUser) { setUser(null); setActiveRole(null); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!profile) { setUser(null); setActiveRole(null); return; }

    const role = profile.role;
    let subProfile = null;

    if (role === 'creator') {
      const { data } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      subProfile = data;
    } else {
      const { data } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      subProfile = data;
    }

    const merged = {
      id: authUser.id,
      email: authUser.email,
      role,
      plan: profile.plan,
      profileComplete: profile.profile_complete,
      darkMode: profile.dark_mode,
      // creator fields
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

  // Sign up — role passed from Signup page
  const signup = async (email, password, role, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, name } },
    });
    if (error) throw error;

    // Create sub-profile row
    if (data.user) {
      if (role === 'creator') {
        const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        await supabase.from('creator_profiles').insert({
          id: data.user.id,
          username: username + Math.floor(Math.random() * 999),
          name,
        });
      } else {
        const slug = name.toLowerCase().replace(/\s+/g, '-') + Math.floor(Math.random() * 999);
        await supabase.from('brand_profiles').insert({
          id: data.user.id,
          slug,
          name,
        });
      }
      // Mark profile_complete false until they fill in details
      await supabase.from('profiles').update({ profile_complete: false }).eq('id', data.user.id);
    }
    return data;
  };

  // Login with email + password
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveRole(null);
  };

  // Mark profile complete (called after profile setup pages)
  const completeProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ profile_complete: true }).eq('id', user.id);
    setUser(u => ({ ...u, profileComplete: true }));
  };

  // Upgrade plan
  const upgradePlan = async (plan) => {
    if (!user) return;
    await supabase.from('profiles').update({ plan }).eq('id', user.id);
    setUser(u => ({ ...u, plan }));
  };

  // Switch role (users that have both creator + brand profiles)
  const switchRole = (role) => {
    setActiveRole(role);
  };

  const toggleDark = () => setDarkMode(d => !d);

  /* ── Keep backward-compat mock login for dev testing ── */
  const loginAsCreator = () => login('sarah@example.com', 'password123').catch(() => {
    // fallback: just set a mock session for UI preview
    setUser({ id: 'mock-c1', name: 'Sarah Chen', role: 'creator', plan: 'free', profileComplete: true, walletBalance: 3120, pendingBalance: 2240, avatar: 'https://i.pravatar.cc/150?img=47' });
    setActiveRole('creator');
  });
  const loginAsBrand = () => login('hello@novaskin.com', 'password123').catch(() => {
    setUser({ id: 'mock-b1', name: 'NovaSkin', role: 'brand', plan: 'free', profileComplete: true, walletBalance: 15000, logo: 'https://i.pravatar.cc/150?img=20' });
    setActiveRole('brand');
  });

  const value = {
    user,
    activeRole,
    darkMode,
    loading,
    // New real auth
    signup,
    login,
    logout,
    completeProfile,
    upgradePlan,
    switchRole,
    toggleDark,
    // Legacy compat (Login.jsx still calls these)
    loginAsCreator,
    loginAsBrand,
    // Computed
    isCreator: activeRole === 'creator',
    isBrand: activeRole === 'brand',
    isLoggedIn: !!user,
    plan: user?.plan || 'free',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
