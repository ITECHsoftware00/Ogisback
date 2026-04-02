import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ShoppingBag, MessageSquare, DollarSign, Megaphone, Star, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { notifications as allNotifs, timeAgo } from '../data';

const typeIcon = {
  order: ShoppingBag, message: MessageSquare, payment: DollarSign,
  campaign: Megaphone, review: Star, revision: AlertCircle,
};
const typeColor = {
  order: 'text-primary bg-primary/10', message: 'text-brand bg-brand/10',
  payment: 'text-wallet bg-wallet/10', campaign: 'text-creator bg-creator/10',
  review: 'text-yellow-600 bg-yellow-100', revision: 'text-red-600 bg-red-100',
};

export default function Notifications() {
  const [notifs, setNotifs] = useState(allNotifs);
  const unread = notifs.filter(n => !n.read);

  const markAll = () => {
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    toast.success('All notifications marked as read');
  };

  const markRead = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="page-title flex items-center gap-2"><Bell size={22} /> Notifications</h1>
            {unread.length > 0 && <p className="text-sm text-gray-500 mt-1">{unread.length} unread</p>}
          </div>
          {unread.length > 0 && (
            <button onClick={markAll} className="btn btn-ghost btn-sm text-primary">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
        </div>

        <div className="space-y-2">
          {notifs.map((notif, i) => {
            const Icon = typeIcon[notif.type] || Bell;
            const colorClass = typeColor[notif.type] || 'text-gray-500 bg-gray-100';
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={notif.link}
                  onClick={() => markRead(notif.id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all hover:shadow-card ${notif.read ? 'bg-white dark:bg-[#111118] opacity-70 hover:opacity-100' : 'bg-white dark:bg-[#111118] border-l-4 border-primary shadow-card'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5">{timeAgo(notif.time)}</p>
                  </div>
                  {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1" />}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {notifs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Bell size={40} className="mx-auto mb-4 opacity-30" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
