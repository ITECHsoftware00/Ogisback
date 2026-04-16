import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ThumbsUp, Eye, Pin, Crown, Star,
  Search, TrendingUp, Flame, Clock, Plus, Tag, ChevronRight,
  X, Send, ArrowLeft, Loader2,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { timeAgo } from '../lib/normalize';
import {
  getForumPosts, createForumPost,
  getForumReplies, addForumReply,
  toggleForumPostLike, checkForumPostLiked,
  incrementForumPostViews,
} from '../lib/db';

const CATEGORIES = [
  { id: 'all',           label: 'All',           icon: Flame },
  { id: 'creator-tips',  label: 'Creator Tips',  icon: Star },
  { id: 'brand-collab',  label: 'Brand Collab',  icon: TrendingUp },
  { id: 'pricing',       label: 'Pricing Help',  icon: Tag },
  { id: 'announcements', label: 'Announcements', icon: Pin },
];

const planBadge = (plan) => {
  if (plan === 'max')  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"><Crown size={9} />MAX</span>;
  if (plan === 'mini') return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-creator/10 text-creator"><Star size={9} />MINI</span>;
  return null;
};

/* ── Skeleton for list ── */
function PostSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-3 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function Forum() {
  const { isLoggedIn, user, activeRole, plan } = useAuth();

  /* ── Post list state ── */
  const [posts,          setPosts]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort,           setSort]           = useState('trending');
  const [search,         setSearch]         = useState('');
  const [searchInput,    setSearchInput]    = useState('');

  /* ── Thread view state ── */
  const [selectedPost, setSelectedPost] = useState(null);
  const [replies,      setReplies]      = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText,    setReplyText]    = useState('');
  const [replying,     setReplying]     = useState(false);
  const [postLiked,    setPostLiked]    = useState(false);

  /* ── New post modal state ── */
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost,     setNewPost]     = useState({ title: '', category: 'creator-tips', body: '', tags: '' });
  const [posting,     setPosting]     = useState(false);

  /* ── Load posts ── */
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getForumPosts({ category: activeCategory, search, sort });
      setPosts(data);
    } catch {
      toast.error('Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, sort]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  /* ── Open thread ── */
  const openThread = async (post) => {
    setSelectedPost(post);
    setReplies([]);
    setRepliesLoading(true);
    setPostLiked(false);
    incrementForumPostViews(post.id).catch(() => {});
    // update view count locally
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, view_count: (p.view_count || 0) + 1 } : p));
    try {
      const [fetchedReplies] = await Promise.all([
        getForumReplies(post.id),
      ]);
      setReplies(fetchedReplies);
      if (user?.id) {
        const liked = await checkForumPostLiked(post.id, user.id);
        setPostLiked(liked);
      }
    } catch {
      toast.error('Failed to load replies');
    } finally {
      setRepliesLoading(false);
    }
  };

  /* ── Like a post ── */
  const likePost = async (postId, e) => {
    e?.stopPropagation();
    if (!isLoggedIn) { toast.error('Sign in to like posts'); return; }
    // optimistic
    const isSelected = selectedPost?.id === postId;
    const wasLiked = isSelected ? postLiked : false;
    const delta = wasLiked ? -1 : 1;
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) + delta) } : p));
    if (isSelected) {
      setPostLiked(!wasLiked);
      setSelectedPost(prev => ({ ...prev, likes: Math.max(0, (prev.likes || 0) + delta) }));
    }
    try {
      await toggleForumPostLike(postId, user.id);
    } catch {
      // revert
      setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) - delta) } : p));
      if (isSelected) {
        setPostLiked(wasLiked);
        setSelectedPost(prev => ({ ...prev, likes: Math.max(0, (prev.likes || 0) - delta) }));
      }
    }
  };

  /* ── Submit reply ── */
  const submitReply = async () => {
    if (!isLoggedIn) { toast.error('Sign in to reply'); return; }
    const body = replyText.trim();
    if (!body || replying) return;
    setReplyText('');
    setReplying(true);
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId, post_id: selectedPost.id, user_id: user.id,
      user_role: activeRole, author_name: user.name || 'You',
      author_avatar: user.avatar || user.logo || null,
      plan: plan || 'free', body, created_at: new Date().toISOString(), _pending: true,
    };
    setReplies(r => [...r, temp]);
    setPosts(ps => ps.map(p => p.id === selectedPost.id ? { ...p, reply_count: (p.reply_count || 0) + 1 } : p));
    setSelectedPost(prev => ({ ...prev, reply_count: (prev.reply_count || 0) + 1 }));
    try {
      const saved = await addForumReply({
        postId: selectedPost.id, userId: user.id, userRole: activeRole,
        authorName: user.name || 'User',
        authorAvatar: user.avatar || user.logo || null,
        plan: plan || 'free', body,
      });
      setReplies(r => r.map(x => x.id === tempId ? saved : x));
      toast.success('Reply posted');
    } catch {
      setReplies(r => r.filter(x => x.id !== tempId));
      setReplyText(body);
      setPosts(ps => ps.map(p => p.id === selectedPost.id ? { ...p, reply_count: Math.max(0, (p.reply_count || 0) - 1) } : p));
      setSelectedPost(prev => ({ ...prev, reply_count: Math.max(0, (prev.reply_count || 0) - 1) }));
      toast.error('Failed to post reply');
    } finally {
      setReplying(false);
    }
  };

  /* ── Submit new post ── */
  const submitPost = async () => {
    if (!newPost.title.trim()) { toast.error('Title is required'); return; }
    if (!newPost.body.trim())  { toast.error('Post body is required'); return; }
    setPosting(true);
    try {
      const tags = newPost.tags.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
      const created = await createForumPost({
        userId: user.id,
        userRole: activeRole || 'creator',
        authorName: user.name || 'User',
        authorAvatar: user.avatar || user.logo || null,
        plan: plan || 'free',
        title: newPost.title.trim(),
        body: newPost.body.trim(),
        category: newPost.category,
        tags,
      });
      setPosts(ps => [created, ...ps]);
      setShowNewPost(false);
      setNewPost({ title: '', category: 'creator-tips', body: '', tags: '' });
      toast.success('Post published!');
    } catch {
      toast.error('Failed to publish post');
    } finally {
      setPosting(false);
    }
  };

  /* ── Search on Enter ── */
  const handleSearchKey = (e) => {
    if (e.key === 'Enter') setSearch(searchInput);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <SEO
        title="Community Forum — Tips, Collabs & Creator Talk"
        description="Join the OgisBack community. Share creator tips, find brand collaboration advice, discuss pricing strategies, and connect with other influencers and marketers."
        url="/forum"
      />
      <Navbar />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-primary via-primary-600 to-creator py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-white mb-1">OgisBack Community</h1>
            <p className="text-white/70 text-sm">Tips, deals, pricing help — from creators and brands who've been there.</p>
          </div>
          <div className="flex items-center gap-3">
            {plan && plan !== 'free' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white">
                {plan === 'max' ? <Crown size={12} /> : <Star size={12} />}
                {plan.toUpperCase()} Member
              </div>
            )}
            <button
              onClick={() => {
                if (!isLoggedIn) { toast.error('Sign in to post in the forum'); return; }
                setShowNewPost(true);
              }}
              className="btn bg-white text-primary btn-md font-bold hover:bg-white/90 shadow-lg"
            >
              <Plus size={15} /> New Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Main feed ── */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKey}
                  onBlur={() => setSearch(searchInput)}
                  placeholder="Search discussions…"
                  className="input pl-9 py-2.5"
                />
              </div>
              <div className="flex bg-white dark:bg-[#111118] rounded-xl border border-gray-100 dark:border-gray-800 p-1">
                {[{ id: 'trending', icon: Flame }, { id: 'new', icon: Clock }, { id: 'active', icon: MessageSquare }].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSort(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${sort === s.id ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                  >
                    <s.icon size={13} /> {s.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeCategory === cat.id ? 'bg-primary text-white border-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/40'}`}
                >
                  <cat.icon size={12} /> {cat.label}
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3, 4].map(i => <PostSkeleton key={i} />)
              ) : posts.length === 0 ? (
                <div className="card p-10 text-center text-gray-400 text-sm">No posts found. Be the first to start a discussion!</div>
              ) : posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.2) }}
                  className="card p-5 hover:shadow-card-hover transition-all cursor-pointer group"
                  onClick={() => openThread(post)}
                >
                  <div className="flex items-start gap-4">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5 ${post.user_role === 'brand' ? 'bg-gradient-to-br from-[#0D9488] to-[#06B6D4]' : 'bg-gradient-to-br from-[#EC4899] to-[#7C3AED]'}`}>
                        {post.author_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {post.pinned && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                            <Pin size={9} /> Pinned
                          </span>
                        )}
                        <span className="text-xs text-gray-400 capitalize">{post.category.replace('-', ' ')}</span>
                      </div>
                      <h3 className="font-heading font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-snug mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.body}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{post.author_name}</span>
                          {planBadge(post.plan)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 ml-auto">
                          <button
                            onClick={e => likePost(post.id, e)}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <ThumbsUp size={12} /> {post.likes || 0}
                          </button>
                          <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.reply_count || 0}</span>
                          <span className="flex items-center gap-1"><Eye size={12} /> {post.view_count || 0}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(post.created_at)}</span>
                        </div>
                      </div>
                      {post.tags?.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {post.tags.map(t => (
                            <span key={t} className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:w-64 space-y-4 flex-shrink-0">
            {(!plan || plan === 'free') && (
              <div className="card p-5 bg-gradient-to-br from-primary/5 to-creator/5 border-primary/20">
                <Crown size={20} className="text-primary mb-3" />
                <h3 className="font-heading font-bold text-gray-900 dark:text-white mb-1 text-sm">Get a Forum Badge</h3>
                <p className="text-xs text-gray-500 mb-4">Mini & Max members get a verified badge on all their posts, boosting trust and engagement.</p>
                <Link to="/pricing" className="btn btn-primary btn-sm w-full">View Plans <ChevronRight size={13} /></Link>
              </div>
            )}

            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 text-sm">Community Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Posts',       val: posts.length > 0 ? `${posts.length}+` : '…' },
                  { label: 'Total Replies',      val: posts.reduce((s, p) => s + (p.reply_count || 0), 0).toLocaleString() },
                  { label: 'Active discussions', val: posts.filter(p => (p.reply_count || 0) > 0).length.toString() },
                  { label: 'Brands in forum',    val: posts.filter(p => p.user_role === 'brand').length.toString() },
                ].map(s => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3 text-sm">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { label: 'Pricing Plans',    to: '/pricing' },
                  { label: 'Explore Creators', to: '/explore' },
                  { label: 'Post a Campaign',  to: '/signup' },
                  { label: 'Creator Login',    to: '/login' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors py-1">
                    {l.label} <ChevronRight size={13} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ Thread View Modal ═══════════════════ */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedPost(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-2xl my-8 z-10"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
                <button onClick={() => setSelectedPost(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 flex-shrink-0">
                  <ArrowLeft size={16} />
                </button>
                <span className="text-xs text-gray-400 capitalize">{selectedPost.category.replace('-', ' ')}</span>
                <button onClick={() => setSelectedPost(null)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              {/* Post body */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {selectedPost.author_avatar ? (
                    <img src={selectedPost.author_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${selectedPost.user_role === 'brand' ? 'bg-gradient-to-br from-[#0D9488] to-[#06B6D4]' : 'bg-gradient-to-br from-[#EC4899] to-[#7C3AED]'}`}>
                      {selectedPost.author_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{selectedPost.author_name}</span>
                      {planBadge(selectedPost.plan)}
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(selectedPost.created_at)}</span>
                  </div>
                </div>

                <h2 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-4 leading-snug">{selectedPost.title}</h2>

                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line mb-5">
                  {selectedPost.body}
                </div>

                {selectedPost.tags?.length > 0 && (
                  <div className="flex gap-1.5 mb-5 flex-wrap">
                    {selectedPost.tags.map(t => (
                      <span key={t} className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">#{t}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-400 pb-5 border-b border-gray-100 dark:border-gray-800">
                  <button
                    onClick={e => likePost(selectedPost.id, e)}
                    className={`flex items-center gap-1.5 transition-colors ${postLiked ? 'text-primary' : 'hover:text-primary'}`}
                  >
                    <ThumbsUp size={14} fill={postLiked ? 'currentColor' : 'none'} />
                    {selectedPost.likes || 0} likes
                  </button>
                  <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {selectedPost.reply_count || 0} replies</span>
                  <span className="flex items-center gap-1.5"><Eye size={14} /> {selectedPost.view_count || 0} views</span>
                </div>

                {/* Replies */}
                <div className="mt-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {repliesLoading ? 'Loading replies…' : replies.length > 0 ? `${replies.length} Replies` : 'No replies yet'}
                  </h3>
                  {repliesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={20} className="animate-spin text-gray-400" />
                    </div>
                  ) : (
                    replies.map(r => (
                      <div key={r.id} className={`flex gap-3 ${r._pending ? 'opacity-60' : ''}`}>
                        {r.author_avatar ? (
                          <img src={r.author_avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${r.user_role === 'brand' ? 'bg-gradient-to-br from-[#0D9488] to-[#06B6D4]' : 'bg-gradient-to-br from-[#EC4899] to-[#7C3AED]'}`}>
                            {r.author_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.author_name}</span>
                            {planBadge(r.plan)}
                            <span className="text-xs text-gray-400 ml-auto">{r._pending ? 'Posting…' : timeAgo(r.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply input */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {isLoggedIn ? (
                    <div className="flex gap-3">
                      {(user?.avatar || user?.logo) ? (
                        <img src={user.avatar || user.logo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#0D9488] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 flex gap-2">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); } }}
                          placeholder="Write a reply…"
                          rows={2}
                          className="input resize-none flex-1 text-sm"
                        />
                        <button
                          onClick={submitReply}
                          disabled={!replyText.trim() || replying}
                          className="btn btn-primary btn-sm self-end disabled:opacity-40"
                        >
                          {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-gray-400">
                      <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link> to join the discussion
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════ New Post Modal ═══════════════════ */}
      <AnimatePresence>
        {showNewPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !posting && setShowNewPost(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-gray-900 dark:text-white">New Discussion</h2>
                <button onClick={() => setShowNewPost(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Title <span className="text-red-400">*</span></label>
                  <input
                    value={newPost.title}
                    onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                    placeholder="What's your discussion about?"
                    className="input"
                    maxLength={120}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Category</label>
                  <select
                    value={newPost.category}
                    onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                    className="input appearance-none cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Body <span className="text-red-400">*</span></label>
                  <textarea
                    value={newPost.body}
                    onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
                    placeholder="Share your experience, question, or insight…"
                    rows={6}
                    className="input resize-none"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Tags <span className="text-xs text-gray-400 font-normal">(comma-separated)</span></label>
                  <input
                    value={newPost.tags}
                    onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                    placeholder="e.g. pricing, growth, beauty"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNewPost(false)} className="btn btn-outline btn-md flex-1" disabled={posting}>Cancel</button>
                <button onClick={submitPost} disabled={posting} className="btn btn-primary btn-md flex-1 disabled:opacity-60">
                  {posting ? (
                    <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Posting…</span>
                  ) : (
                    <><Send size={15} /> Publish Post</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
