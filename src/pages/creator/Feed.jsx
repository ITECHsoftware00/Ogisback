import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Grid3X3, List, Trash2, Eye, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getCreatorPosts, deleteContentPost } from '../../lib/db';
import { formatNumber } from '../../lib/normalize';

const typeColors = {
  reel:     'badge-creator',
  video:    'badge-primary',
  photo:    'badge-gray',
  carousel: 'badge-brand',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CreatorFeed() {
  const { user } = useAuth();
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]     = useState('grid');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user?.id) return;
    getCreatorPosts(user.id)
      .then(setPosts)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    try {
      await deleteContentPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <DashboardLayout>
      <SEO title="My Content" noindex={true} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">My Content</h1>
          <p className="page-subtitle">
            {posts.length} posts · {formatNumber(totalLikes)} total likes
          </p>
        </div>
        <Link to="/creator/post/new" className="btn btn-creator btn-md">
          <Plus size={16} /> New Post
        </Link>
      </div>

      {/* Filters + View toggle */}
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-creator" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Grid3X3}
          title={filter === 'all' ? 'No content yet' : `No ${filter} posts`}
          description="Start uploading to build your portfolio and attract brand deals."
          action={
            <Link to="/creator/post/new" className="btn btn-creator btn-md">
              <Plus size={16} /> Upload First Post
            </Link>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
            >
              {post.type === 'video' || post.type === 'reel' ? (
                <video src={post.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" muted />
              ) : (
                <img src={post.thumbnail_url || post.media_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <a href={post.media_url} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full hover:bg-gray-100" onClick={e => e.stopPropagation()}>
                  <Eye size={14} />
                </a>
                <button onClick={() => handleDelete(post.id)} className="p-2 bg-red-500 rounded-full hover:bg-red-600">
                  <Trash2 size={14} className="text-white" />
                </button>
              </div>

              {/* Type badge */}
              <div className="absolute top-2 left-2">
                <span className={`${typeColors[post.type] || 'badge-gray'} text-[10px]`}>{post.type}</span>
              </div>

              {/* Likes */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-[11px]">❤ {formatNumber(post.likes || 0)}</p>
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
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card flex items-center gap-4 p-4"
            >
              <img
                src={post.thumbnail_url || post.media_url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{post.caption}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`${typeColors[post.type] || 'badge-gray'} text-[10px]`}>{post.type}</span>
                  <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500 hidden sm:block">
                <p>❤ {formatNumber(post.likes || 0)}</p>
                {post.views > 0 && <p>👁 {formatNumber(post.views)}</p>}
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
