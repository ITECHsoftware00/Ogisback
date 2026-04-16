import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Image, Upload, Megaphone, ShoppingBag,
  MessageSquare, Wallet, ArrowDownToLine, BarChart3, UserCircle,
  Settings, Search, Star, CreditCard, BookMarked, Zap, Hash
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMessageNotifications } from '../../context/MessageNotificationContext';

const creatorLinks = [
  { to: '/creator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/creator/feed', icon: Image, label: 'My Content' },
  { to: '/creator/post/new', icon: Upload, label: 'New Post', highlight: true },
  { to: '/creator/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/creator/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/creator/pitch', icon: Zap, label: 'Pitch Brands' },
  { to: '/creator/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/creator/earnings', icon: Wallet, label: 'Earnings' },
  { to: '/creator/withdraw', icon: ArrowDownToLine, label: 'Withdraw' },
  { to: '/creator/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/forum', icon: Hash, label: 'Community' },
  { to: '/creator/profile/edit', icon: UserCircle, label: 'My Profile' },
  { to: '/creator/settings', icon: Settings, label: 'Settings' },
];

const brandLinks = [
  { to: '/brand/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/brand/discover', icon: Search, label: 'Discover Creators' },
  { to: '/brand/campaigns', icon: Megaphone, label: 'My Campaigns' },
  { to: '/brand/campaigns/new', icon: Upload, label: 'New Campaign', highlight: true },
  { to: '/brand/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/brand/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/brand/payments', icon: CreditCard, label: 'Payments' },
  { to: '/brand/saved', icon: BookMarked, label: 'Saved Creators' },
  { to: '/forum', icon: Hash, label: 'Community' },
  { to: '/brand/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { activeRole, user } = useAuth();
  const { unreadCount } = useMessageNotifications();
  const links = activeRole === 'creator' ? creatorLinks : brandLinks;
  const isCreator = activeRole === 'creator';

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-hide border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0A0A0F] pt-4 pb-6">
      {/* User info */}
      <div className="px-4 mb-6">
        <div className={`rounded-2xl p-4 ${isCreator ? 'bg-creator/5 border border-creator/10' : 'bg-brand/5 border border-brand/10'}`}>
          <div className="flex items-center gap-3">
            {(user?.avatar || user?.logo) ? (
              <img
                src={user.avatar || user.logo}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isCreator ? 'bg-gradient-creator' : 'bg-gradient-brand'}`}>
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.name}</p>
              <span className={`text-xs font-medium ${isCreator ? 'text-creator' : 'text-brand'}`}>
                {isCreator ? '✦ Creator' : '◆ Brand'}
              </span>
            </div>
          </div>
          {isCreator && (
            <div className="mt-3 pt-3 border-t border-creator/10">
              <p className="text-xs text-gray-500">Wallet Balance</p>
              <p className="font-heading font-bold text-lg text-wallet">${user?.walletBalance?.toLocaleString() || '0'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {links.map(({ to, icon: Icon, label, highlight }) => {
          const isMessages = label === 'Messages';
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${isCreator ? 'sidebar-link-creator' : 'sidebar-link-brand'} sidebar-link ${isActive ? 'active' : ''} ${highlight ? 'mt-2' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex-shrink-0">
                    <Icon size={17} className={highlight && !isActive ? (isCreator ? 'text-creator' : 'text-brand') : ''} />
                    {isMessages && unreadCount > 0 && !isActive && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>{label}</span>
                  {isMessages && unreadCount > 0 && !isActive && (
                    <span className="ml-auto min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {highlight && !isActive && !isMessages && (
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isCreator ? 'bg-creator/10 text-creator' : 'bg-brand/10 text-brand'}`}>
                      NEW
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom CTA */}
      <div className="px-4 mt-4">
        <div className={`rounded-xl p-3 text-center ${isCreator ? 'bg-gradient-creator' : 'bg-gradient-brand'}`}>
          <p className="text-white text-xs font-semibold mb-1">{isCreator ? 'Boost your profile' : 'Find your creator'}</p>
          <p className="text-white/80 text-[11px]">{isCreator ? 'Complete your profile to get more brand deals' : 'Browse 500+ verified creators'}</p>
        </div>
      </div>
    </aside>
  );
}
