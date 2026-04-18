import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Image, Upload, Megaphone, ShoppingBag,
  MessageSquare, Wallet, ArrowDownToLine, BarChart3, UserCircle,
  Settings, Search, CreditCard, BookMarked, Zap, Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMessageNotifications } from '../../context/MessageNotificationContext';

const creatorGroups = [
  {
    label: 'Main',
    links: [
      { to: '/creator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/creator/feed',      icon: Image,           label: 'My Content' },
      { to: '/creator/post/new',  icon: Upload,          label: 'New Post',  highlight: true },
    ],
  },
  {
    label: 'Work',
    links: [
      { to: '/creator/campaigns', icon: Megaphone,    label: 'Campaigns' },
      { to: '/creator/orders',    icon: ShoppingBag,  label: 'Orders' },
      { to: '/creator/pitch',     icon: Zap,          label: 'Pitch Brands' },
      { to: '/creator/messages',  icon: MessageSquare,label: 'Messages' },
    ],
  },
  {
    label: 'Finance',
    links: [
      { to: '/creator/earnings',  icon: Wallet,           label: 'Earnings' },
      { to: '/creator/withdraw',  icon: ArrowDownToLine,  label: 'Withdraw' },
      { to: '/creator/analytics', icon: BarChart3,        label: 'Analytics' },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/forum',                  icon: Hash,        label: 'Community' },
      { to: '/creator/profile/edit',   icon: UserCircle,  label: 'My Profile' },
      { to: '/creator/settings',       icon: Settings,    label: 'Settings' },
    ],
  },
];

const brandGroups = [
  {
    label: 'Main',
    links: [
      { to: '/brand/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/brand/discover',  icon: Search,          label: 'Discover' },
    ],
  },
  {
    label: 'Work',
    links: [
      { to: '/brand/campaigns',     icon: Megaphone,   label: 'Campaigns' },
      { to: '/brand/campaigns/new', icon: Upload,      label: 'New Campaign', highlight: true },
      { to: '/brand/orders',        icon: ShoppingBag, label: 'Orders' },
      { to: '/brand/messages',      icon: MessageSquare, label: 'Messages' },
    ],
  },
  {
    label: 'Finance',
    links: [
      { to: '/brand/payments', icon: CreditCard,  label: 'Payments' },
      { to: '/brand/saved',    icon: BookMarked,  label: 'Saved Creators' },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/forum',         icon: Hash,     label: 'Community' },
      { to: '/brand/settings',icon: Settings, label: 'Settings' },
    ],
  },
];

export default function Sidebar() {
  const { activeRole, user } = useAuth();
  const { unreadCount } = useMessageNotifications();
  const groups = activeRole === 'creator' ? creatorGroups : brandGroups;
  const isCreator = activeRole === 'creator';
  const accentColor = isCreator ? 'text-creator' : 'text-brand';
  const accentBg    = isCreator ? 'bg-creator'   : 'bg-brand';

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-hide border-r border-gray-100/80 dark:border-white/[0.05] bg-white dark:bg-[#09090F] pt-5 pb-6">

      {/* ── User chip ── */}
      <div className="px-3 mb-5">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] group">
          <div className={`relative flex-shrink-0`}>
            {(user?.avatar || user?.logo) ? (
              <img src={user.avatar || user.logo} alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-[#09090F]" />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${isCreator ? 'bg-gradient-to-br from-[#7C3AED] to-[#EC4899]' : 'bg-gradient-to-br from-[#0D9488] to-[#0EA5E9]'}`}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#09090F] bg-emerald-400`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{user?.name || 'User'}</p>
            <p className={`text-[10px] font-medium truncate ${accentColor}`}>{isCreator ? 'Creator' : 'Brand'}</p>
          </div>
          {isCreator && user?.walletBalance > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums flex-shrink-0">
              ${user.walletBalance.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 px-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-600 uppercase px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.links.map(({ to, icon: Icon, label, highlight }) => {
                const isMessages = label === 'Messages';
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group/link ${
                        isActive
                          ? `${isCreator ? 'bg-creator/8 text-creator dark:bg-creator/10' : 'bg-brand/8 text-brand dark:bg-brand/10'}`
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Left accent bar */}
                        {isActive && (
                          <motion.div
                            layoutId={`sidebar-accent-${isCreator ? 'c' : 'b'}`}
                            className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full ${accentBg}`}
                          />
                        )}

                        <div className="relative flex-shrink-0">
                          <Icon size={15} className={isActive ? accentColor : 'text-gray-400 dark:text-gray-500 group-hover/link:text-gray-600 dark:group-hover/link:text-gray-300 transition-colors'} />
                          {isMessages && unreadCount > 0 && !isActive && (
                            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>

                        <span className="flex-1 truncate">{label}</span>

                        {isMessages && unreadCount > 0 && !isActive && (
                          <span className="ml-auto min-w-[18px] h-4.5 px-1 py-0.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                        {highlight && !isActive && (
                          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${isCreator ? 'bg-creator/10 text-creator' : 'bg-brand/10 text-brand'}`}>
                            NEW
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Beta badge ── */}
      <div className="px-3 mt-5">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02]">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 tracking-wider">
            BETA
          </span>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-tight">Early access — features shipping daily</p>
        </div>
      </div>
    </aside>
  );
}
