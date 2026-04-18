import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Moon, Sun, Menu, X, ChevronDown,
  User, LogOut, Settings, Repeat2, Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMessageNotifications } from '../../context/MessageNotificationContext';
import { getNotifications } from '../../lib/db';
import Logo from '../Logo';

function UserAvatar({ user }) {
  const [imgError, setImgError] = useState(false);
  const src = user?.avatar || user?.logo;
  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={user?.name || ''}
        className="w-8 h-8 rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#0D9488] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {user?.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

export default function Navbar() {
  const { user, activeRole, darkMode, toggleDark, logout, switchRole, isLoggedIn } = useAuth();
  const { unreadCount: unreadMessages } = useMessageNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [bellShake, setBellShake] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getNotifications(user.id, 30)
      .then(notifs => setUnreadNotifs(notifs.filter(n => !n.is_read).length))
      .catch(() => {});
  }, [user?.id]);

  // Shake the bell whenever a new message arrives
  useEffect(() => {
    if (unreadMessages === 0) return;
    setBellShake(true);
    const t = setTimeout(() => setBellShake(false), 600);
    return () => clearTimeout(t);
  }, [unreadMessages]);

  const totalUnread = unreadNotifs + unreadMessages;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchRole = () => {
    const newRole = activeRole === 'creator' ? 'brand' : 'creator';
    switchRole(newRole);
    navigate(newRole === 'creator' ? '/creator/dashboard' : '/brand/discover');
    setUserMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo + Beta */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <Logo size="md" />
          <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 tracking-wider">
            BETA
          </span>
        </Link>

        {/* Center nav (desktop) */}
        {!isLoggedIn && (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/explore" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Explore</Link>
            <Link to="/forum" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Forum</Link>
            <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Pricing</Link>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">For Creators</Link>
          </div>
        )}

        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-1">
            {activeRole === 'creator' ? (
              <>
                <Link to="/creator/dashboard" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">Dashboard</Link>
                <Link to="/creator/feed" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">My Content</Link>
                <Link to="/creator/campaigns" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">Campaigns</Link>
                <Link to="/forum" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">Community</Link>
              </>
            ) : (
              <>
                <Link to="/brand/discover" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">Discover</Link>
                <Link to="/brand/campaigns" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">Campaigns</Link>
                <Link to="/forum" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">Community</Link>
              </>
            )}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button onClick={toggleDark} className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn ? (
            <>
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl transition-all group"
              >
                {/* Glow ring when there are notifications */}
                {totalUnread > 0 && (
                  <span className="absolute inset-0 rounded-xl bg-amber-400/10 dark:bg-amber-400/15 ring-1 ring-amber-400/30 animate-pulse pointer-events-none" />
                )}
                <motion.div
                  animate={bellShake ? { rotate: [0, -18, 16, -12, 10, -6, 4, 0] } : { rotate: 0 }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                >
                  {totalUnread > 0
                    ? <BellRing size={18} className="text-amber-500 dark:text-amber-400" />
                    : <Bell size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  }
                </motion.div>
                {totalUnread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-amber-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-sm"
                  >
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </motion.span>
                )}
              </Link>

              {/* Role badge */}
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${activeRole === 'creator' ? 'bg-creator/10 text-creator' : 'bg-brand/10 text-brand'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${activeRole === 'creator' ? 'bg-creator' : 'bg-brand'}`} />
                {activeRole === 'creator' ? 'Creator' : 'Brand'}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <UserAvatar user={user} />
                  <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      className="absolute right-0 top-12 w-56 card shadow-glass p-2 z-50"
                    >
                      <div className="px-3 py-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="divider my-1" />
                      <button onClick={handleSwitchRole} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-all">
                        <Repeat2 size={15} />
                        Switch to {activeRole === 'creator' ? 'Brand' : 'Creator'}
                      </button>
                      {activeRole === 'creator' && (
                        <Link to="/creator/earnings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-all">
                          <Wallet size={15} />
                          <span>Wallet</span>
                          <span className="ml-auto text-xs font-semibold text-wallet">${user?.walletBalance?.toLocaleString()}</span>
                        </Link>
                      )}
                      <Link to={activeRole === 'creator' ? '/creator/settings' : '/brand/settings'} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-all">
                        <Settings size={15} /> Settings
                      </Link>
                      <div className="divider my-1" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost btn-sm hidden sm:flex">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(o => !o)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0A0A0F] md:hidden overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {!isLoggedIn && (
                <>
                  <Link to="/explore" onClick={() => setMenuOpen(false)} className="sidebar-link">Explore</Link>
                  <Link to="/forum" onClick={() => setMenuOpen(false)} className="sidebar-link">Forum</Link>
                  <Link to="/pricing" onClick={() => setMenuOpen(false)} className="sidebar-link">Pricing</Link>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="sidebar-link">Sign in</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="btn btn-primary btn-md mt-2">Get Started</Link>
                </>
              )}
              {isLoggedIn && activeRole === 'creator' && (
                <>
                  <Link to="/creator/dashboard" onClick={() => setMenuOpen(false)} className="sidebar-link">Dashboard</Link>
                  <Link to="/creator/feed" onClick={() => setMenuOpen(false)} className="sidebar-link">My Content</Link>
                  <Link to="/creator/campaigns" onClick={() => setMenuOpen(false)} className="sidebar-link">Campaigns</Link>
                  <Link to="/creator/earnings" onClick={() => setMenuOpen(false)} className="sidebar-link">Earnings</Link>
                  <Link to="/creator/messages" onClick={() => setMenuOpen(false)} className="sidebar-link">Messages</Link>
                </>
              )}
              {isLoggedIn && activeRole === 'brand' && (
                <>
                  <Link to="/brand/discover" onClick={() => setMenuOpen(false)} className="sidebar-link">Discover</Link>
                  <Link to="/brand/campaigns" onClick={() => setMenuOpen(false)} className="sidebar-link">Campaigns</Link>
                  <Link to="/brand/orders" onClick={() => setMenuOpen(false)} className="sidebar-link">Orders</Link>
                  <Link to="/brand/messages" onClick={() => setMenuOpen(false)} className="sidebar-link">Messages</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
