import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Search, X, MessageCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getConversations } from '../../lib/db';
import { timeAgo } from '../../lib/normalize';

function Skeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-1/3" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-2/3" />
      </div>
      <div className="h-3 w-10 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
  );
}

function ConvRow({ conv, index }) {
  const name   = conv.brand_profiles?.name    || 'Brand';
  const avatar = conv.brand_profiles?.logo_url || `https://i.pravatar.cc/48?u=${conv.brand_id}`;
  const unread = conv.unread_count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.035, duration: 0.18 }}
    >
      <Link
        to={`/creator/messages/${conv.id}`}
        className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors relative"
      >
        {unread > 0 && (
          <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-creator" />
        )}
        <div className="relative flex-shrink-0">
          <img src={avatar} alt="" className="w-11 h-11 rounded-2xl object-cover" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-creator rounded-full border-2 border-white dark:border-[#111118]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>
              {name}
            </p>
            <p className={`text-[11px] flex-shrink-0 ${unread > 0 ? 'text-creator font-semibold' : 'text-gray-400'}`}>
              {timeAgo(conv.last_message_at)}
            </p>
          </div>
          <p className={`text-xs truncate ${unread > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>
            {conv.last_message || 'No messages yet'}
          </p>
        </div>
        {/* Bubble: count if unread, subtle icon if read */}
        {unread > 0 ? (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-shrink-0 min-w-[20px] h-5 bg-creator text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-sm"
          >
            {unread}
          </motion.span>
        ) : (
          <MessageCircle size={15} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
        )}
      </Link>
    </motion.div>
  );
}

export default function CreatorMessages() {
  const { user } = useAuth();
  const [search, setSearch]   = useState('');
  const [convs, setConvs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getConversations(user.id, 'creator')
      .then(setConvs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered    = convs.filter(c => {
    const name = c.brand_profiles?.name || '';
    const last = c.last_message || '';
    return !search || name.toLowerCase().includes(search.toLowerCase()) || last.toLowerCase().includes(search.toLowerCase());
  });
  const unread      = filtered.filter(c => c.unread_count > 0);
  const read        = filtered.filter(c => !c.unread_count);
  const unreadCount = convs.filter(c => c.unread_count > 0).length;

  return (
    <DashboardLayout>
      <SEO title="Messages" noindex={true} />
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Messages</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>

        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] rounded-2xl pl-10 pr-9 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-creator/25 focus:border-creator/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="card overflow-hidden divide-y divide-gray-50 dark:divide-white/[0.04]">
            {[...Array(5)].map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" description="When brands message you, conversations will appear here." />
        ) : (
          <div className="card overflow-hidden divide-y divide-gray-50 dark:divide-white/[0.04]">
            {unread.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-creator">Unread</p>
                </div>
                {unread.map((conv, i) => <ConvRow key={conv.id} conv={conv} index={i} />)}
              </>
            )}
            {read.length > 0 && (
              <>
                {unread.length > 0 && (
                  <div className="px-4 pt-3 pb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Earlier</p>
                  </div>
                )}
                {read.map((conv, i) => <ConvRow key={conv.id} conv={conv} index={i} />)}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
