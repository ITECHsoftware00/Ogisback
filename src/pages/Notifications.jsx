import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ShoppingBag, MessageSquare, DollarSign, Megaphone, Star, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useRealtime';

const typeIcon = {
  order: ShoppingBag, message: MessageSquare, payment: DollarSign,
  campaign: Megaphone, review: Star, revision: AlertCircle,
};
const typeColor = {
  order: 'text-primary bg-primary/10', message: 'text-brand bg-brand/10',
  payment: 'text-wallet bg-wallet/10', campaign: 'text-creator bg-creator/10',
  review: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20', revision: 'text-red-600 bg-red-100 dark:bg-red-900/20',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications(user?.id);

  const handleMarkAll = async () => {
    await markAllRead();
    toast.success('All notifications marked as read');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title flex items-center gap-2"><Bell size={22} /> Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} className="btn btn-ghost btn-sm text-primary">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const Icon = typeIcon[notif.type] || Bell;
              const colorClass = typeColor[notif.type] || 'text-gray-500 bg-gray-100 dark:bg-gray-800';
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Link
                    to={notif.link || '#'}
                    onClick={() => !notif.read && markRead(notif.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all hover:shadow-card ${
                      notif.read
                        ? 'bg-white dark:bg-[#111118] opacity-70 hover:opacity-100'
                        : 'bg-white dark:bg-[#111118] border-l-4 border-primary shadow-card'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1.5">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Bell size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">We'll let you know when something happens.</p>
          </div>
        )}
      </div>
    </div>
  );
}
