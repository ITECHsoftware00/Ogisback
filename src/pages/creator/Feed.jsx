import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Grid3X3, List, Trash2, Edit3, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import { contentFeed, formatNumber, timeAgo } from '../../data';

const typeColors = { reel: 'badge-creator', video: 'badge-primary', photo: 'badge-gray', carousel: 'badge-brand' };

export default function CreatorFeed() {
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const myPosts = contentFeed.filter(p => p.creatorId === 'c1');
  const filtered = filter === 'all' ? myPosts : myPosts.filter(p => p.type === filter);

  const handleDelete = (id) => {
    toast.error('Post deleted (demo)');
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">My Content</h1>
          <p className="page-subtitle">{myPosts.length} posts · {formatNumber(myPosts.reduce((s, p) => s + p.likes, 0))} total likes</p>
        </div>
        <Link to="/creator/post/new" className="btn btn-creator btn-md">
          <Plus size={16} /> New Post
        </Link>
      </div>

      {/* Filters + View */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          {['all', 'photo', 'reel', 'video', 'carousel'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-creator text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-creator text-white' : 'text-gray-400 hover:text-gray-700'}`}><Grid3X3 size={15} /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-creator text-white' : 'text-gray-400 hover:text-gray-700'}`}><List size={15} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Grid3X3} title="No content yet" description="Start uploading to build your portfolio and attract brand deals." action={<Link to="/creator/post/new" className="btn btn-creator btn-md"><Plus size={16} /> Upload First Post</Link>} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer">
              <img src={post.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-all"><Eye size={14} /></button>
                <button className="p-2 bg-white rounded-full hover:bg-gray-100 transition-all"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(post.id)} className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-all"><Trash2 size={14} className="text-white" /></button>
              </div>
              <div className="absolute top-2 left-2">
                <span className={`${typeColors[post.type]} text-[10px]`}>{post.type}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-[11px]">❤ {formatNumber(post.likes)}</p>
              </div>
              {/* Watermark */}
              <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gradient-creator" />
                <span className="text-white text-[8px]">OgisBack</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="card flex items-center gap-4 p-4">
              <img src={post.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{post.caption}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`${typeColors[post.type]} text-[10px]`}>{post.type}</span>
                  <span className="text-xs text-gray-400">{timeAgo(post.postedDate)}</span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 hidden sm:block">
                <p>❤ {formatNumber(post.likes)}</p>
                <p>🔖 {formatNumber(post.saves)}</p>
                {post.views > 0 && <p>👁 {formatNumber(post.views)}</p>}
              </div>
              <div className="flex gap-1">
                <button className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Edit3 size={15} /></button>
                <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={15} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
