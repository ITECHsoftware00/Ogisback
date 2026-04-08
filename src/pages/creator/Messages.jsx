import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getConversations } from '../../lib/db';
import { timeAgo } from '../../lib/normalize';

export default function CreatorMessages() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getConversations(user.id, 'creator')
      .then(setConvs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = convs.filter(c => {
    const name = c.brand_profiles?.name || '';
    const last = c.last_message || '';
    return !search || name.toLowerCase().includes(search.toLowerCase()) || last.toLowerCase().includes(search.toLowerCase());
  });

  const unreadCount = convs.filter(c => c.unread_count > 0).length;

  return (
    <DashboardLayout>
      <SEO title="Messages" noindex={true} />
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">{unreadCount} unread conversations</p>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="input pl-10" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading messages...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" description="When brands message you, conversations will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((conv, i) => {
            const name = conv.brand_profiles?.name || 'Brand';
            const avatar = conv.brand_profiles?.logo_url || `https://i.pravatar.cc/48?u=${conv.brand_id}`;
            const unread = conv.unread_count || 0;
            return (
              <motion.div key={conv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={`/creator/messages/${conv.id}`} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-card ${unread > 0 ? 'bg-white dark:bg-[#111118] border-primary/20 shadow-sm' : 'bg-white dark:bg-[#111118] border-gray-100 dark:border-gray-800'}`}>
                  <div className="relative">
                    <img src={avatar} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                    {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-creator rounded-full text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm font-semibold ${unread > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{name}</p>
                      <p className="text-[11px] text-gray-400">{timeAgo(conv.last_message_at)}</p>
                    </div>
                    <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500'}`}>{conv.last_message || 'No messages yet'}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
