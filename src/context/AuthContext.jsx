import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const MOCK_CREATOR = {
  id: 'c1', username: 'sarahchen', name: 'Sarah Chen',
  avatar: 'https://i.pravatar.cc/150?img=47',
  email: 'sarah@example.com', role: 'creator',
  profileComplete: true, walletBalance: 3120,
  pendingBalance: 2240, plan: 'free',
};
const MOCK_BRAND = {
  id: 'b1', slug: 'novaskin', name: 'NovaSkin',
  logo: 'https://i.pravatar.cc/150?img=20',
  email: 'hello@novaskin.com', role: 'brand',
  profileComplete: true, walletBalance: 15000, plan: 'free',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null); // 'creator' | 'brand'
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ogisback_dark') === 'true';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ogisback_user');
    const storedRole = localStorage.getItem('ogisback_role');
    if (stored) {
      setUser(JSON.parse(stored));
      setActiveRole(storedRole || 'creator');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ogisback_dark', darkMode);
  }, [darkMode]);

  const loginAsCreator = () => {
    const userData = { ...MOCK_CREATOR, profileComplete: false };
    setUser(userData);
    setActiveRole('creator');
    localStorage.setItem('ogisback_user', JSON.stringify(userData));
    localStorage.setItem('ogisback_role', 'creator');
    return userData;
  };

  const loginAsBrand = () => {
    const userData = { ...MOCK_BRAND, profileComplete: false };
    setUser(userData);
    setActiveRole('brand');
    localStorage.setItem('ogisback_user', JSON.stringify(userData));
    localStorage.setItem('ogisback_role', 'brand');
    return userData;
  };

  const completeProfile = () => {
    const updated = { ...user, profileComplete: true };
    setUser(updated);
    localStorage.setItem('ogisback_user', JSON.stringify(updated));
  };

  const switchRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('ogisback_role', role);
  };

  const logout = () => {
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem('ogisback_user');
    localStorage.removeItem('ogisback_role');
  };

  const toggleDark = () => setDarkMode(d => !d);

  const upgradePlan = (plan) => {
    const updated = { ...user, plan };
    setUser(updated);
    localStorage.setItem('ogisback_user', JSON.stringify(updated));
  };

  const value = {
    user, activeRole, darkMode, loading,
    loginAsCreator, loginAsBrand, completeProfile,
    switchRole, logout, toggleDark, upgradePlan,
    isCreator: activeRole === 'creator',
    isBrand: activeRole === 'brand',
    isLoggedIn: !!user,
    plan: user?.plan || 'free',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
