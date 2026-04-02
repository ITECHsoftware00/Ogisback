import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import { conversations, timeAgo } from '../../data';

export default function BrandMessages() {
  const [search, setSearch] = useState('');
  const allConvs = conversations;
  const filtered = allConvs.filter(c =>
    !search || c.creatorName.toLowerCase().includes(search.toLowerCase()) || c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">{conversations.filter(c => c.unread > 0).length} unread conversations</p>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="input pl-10" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" description="Start a conversation with creators you want to work with." action={<Link to="/brand/discover" className="btn btn-brand btn-md">Discover Creators</Link>} />
      ) : (
        <div className="space-y-2">
          {filtered.map((conv, i) => (
            <motion.div key={conv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/brand/messages/${conv.id}`} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-card ${conv.unread > 0 ? 'bg-white dark:bg-[#111118] border-brand/20 shadow-sm' : 'bg-white dark:bg-[#111118] border-gray-100 dark:border-gray-800'}`}>
                <div className="relative">
                  <img src={conv.creatorAvatar} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                  {conv.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand rounded-full text-white text-[10px] font-bold flex items-center justify-center">{conv.unread}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold ${conv.unread > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{conv.creatorName}</p>
                    <p className="text-[11px] text-gray-400">{timeAgo(conv.lastTime)}</p>
                  </div>
                  <p className={`text-xs truncate ${conv.unread > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
