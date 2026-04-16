import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Heart, MessageCircle, Share2, Bookmark,
  Play, Images, Film, CheckCircle, Zap, Send, Trash2
} from 'lucide-react';
import { formatNumber, timeAgo } from '../lib/normalize';
import { useAuth } from '../context/AuthContext';
import {
  togglePostLike, checkPostLiked,
  getPostComments, addPostComment, deletePostComment,
  savePost, unsavePost, checkPostSaved,
  incrementPostViews,
} from '../lib/db';
import toast from 'react-hot-toast';

const TYPE_ICON  = { video: Play, carousel: Images, reel: Film, photo: null };
const TYPE_LABEL = { video: 'Video', carousel: 'Carousel', reel: 'Reel', photo: 'Photo' };

export default function PostDetailModal({ post, onClose, onHire, onMessage }) {
  const { user, isBrand, activeRole } = useAuth();

  // Like state
  const [liked,       setLiked]       = useState(false);
  const [likeCount,   setLikeCount]   = useState(post.likes || 0);
  const [saved,       setSaved]       = useState(false);
  const [savePending, setSavePending] = useState(false);

  // Comments
  const [comments,    setComments]    = useState([]);
  const [commLoading, setCommLoading] = useState(true);
  const [commentCount,setCommentCount]= useState(post.comments || 0);
  const [input,       setInput]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const TypeIcon   = TYPE_ICON[post.type];
  const thumb      = post.thumbnail || post.media_url;
  const handle     = `@${post.username || (post.creator || '').toLowerCase().replace(/\s+/g, '')}`;
  const profilePath = `/creator/${post.username || (post.creator || '').toLowerCase().replace(/\s+/g, '')}`;

  // Close on Escape
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Load like + save state and increment views
  useEffect(() => {
    incrementPostViews(post.id).catch(() => {});
    if (!user?.id) return;
    checkPostLiked(post.id, user.id).then(setLiked).catch(() => {});
    checkPostSaved(user.id, post.id).then(setSaved).catch(() => {});
  }, [post.id, user?.id]);

  // Load comments
  useEffect(() => {
    getPostComments(post.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setCommLoading(false));
  }, [post.id]);

  const toggleLike = async () => {
    if (!user?.id) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
    try { await togglePostLike(post.id, user.id); }
    catch { setLiked(!next); setLikeCount(c => next ? c - 1 : c + 1); }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${profilePath}`;
    if (navigator.share) navigator.share({ title: post.caption || '', url }).catch(() => {});
    else { navigator.clipboard?.writeText(url); toast.success('Link copied!'); }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const body = input.trim();
    if (!body || !user?.id || submitting) return;
    setInput('');
    setSubmitting(true);
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId, post_id: post.id, user_id: user.id, user_role: activeRole,
      author_name: user.name || 'You', author_avatar: user.avatar || user.logo || null,
      body, created_at: new Date().toISOString(), _pending: true,
    };
    setComments(p => [...p, temp]);
    setCommentCount(c => c + 1);
    try {
      const saved = await addPostComment(post.id, user.id, activeRole, body, user.name || 'User', user.avatar || user.logo || null);
      setComments(p => p.map(c => c.id === tempId ? saved : c));
    } catch {
      setComments(p => p.filter(c => c.id !== tempId));
      setCommentCount(c => Math.max(0, c - 1));
      setInput(body);
      toast.error('Failed to post comment');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (commentId) => {
    setComments(p => p.filter(c => c.id !== commentId));
    setCommentCount(c => Math.max(0, c - 1));
    try { await deletePostComment(commentId); }
    catch { toast.error('Failed to delete comment'); }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          key="modal"
          className="relative w-full max-w-4xl bg-white dark:bg-[#111118] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          style={{ maxHeight: '90vh' }}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── LEFT: Media ── */}
          <div className="relative md:w-[55%] bg-black flex items-center justify-center flex-shrink-0" style={{ minHeight: 280 }}>
            {(post.type === 'video' || post.type === 'reel') ? (
              <video
                src={post.media_url}
                poster={post.thumbnail_url || post.thumbnail}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
                style={{ maxHeight: '90vh' }}
              />
            ) : (
              <img
                src={thumb}
                alt={post.caption || ''}
                className="w-full h-full object-contain"
                style={{ maxHeight: '90vh' }}
                onError={e => { e.currentTarget.src = 'https://placehold.co/600x450/1a1a2e/7C3AED?text=No+Preview'; }}
              />
            )}

            {/* Type badge */}
            {TypeIcon && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <TypeIcon size={11} className="text-white" />
                <span className="text-white text-[10px] font-semibold">{TYPE_LABEL[post.type]}</span>
              </div>
            )}

            {/* Views */}
            {post.views > 0 && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <span className="text-white text-[10px] font-semibold">{formatNumber(post.views)} views</span>
              </div>
            )}
          </div>

          {/* ── RIGHT: Info + comments ── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* Creator header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <Link to={profilePath} onClick={onClose}>
                <img
                  src={post.avatar}
                  alt={post.creator || ''}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                  onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.creator || 'C')}&background=7C3AED&color=fff&size=40`; }}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={profilePath}
                  onClick={onClose}
                  className="text-sm font-bold text-gray-900 dark:text-white hover:text-brand transition-colors block truncate"
                >
                  {handle}
                </Link>
                <p className="text-[11px] text-gray-400">{timeAgo(post.postedDate || post.created_at)}</p>
              </div>

              {/* Brand CTAs in header */}
              {isBrand && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { onMessage?.(post); onClose(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-brand hover:text-brand transition-colors"
                  >
                    <MessageCircle size={13} /> Message
                  </button>
                  <button
                    onClick={() => { onHire?.(post); onClose(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Zap size={13} /> Hire
                  </button>
                </div>
              )}
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
              {/* Caption as first comment */}
              {post.caption && (
                <div className="flex gap-2.5">
                  <img
                    src={post.avatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                    onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.creator || 'C')}&background=7C3AED&color=fff&size=28`; }}
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white mr-1.5">{handle}</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{post.caption}</span>
                  </div>
                </div>
              )}

              {/* Comments */}
              {commLoading ? (
                <div className="space-y-3 pt-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-2.5 animate-pulse">
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No comments yet. Be the first!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className={`flex gap-2.5 ${c._pending ? 'opacity-60' : ''}`}>
                    <div className="flex-shrink-0 mt-0.5">
                      {c.author_avatar ? (
                        <img src={c.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${c.user_role === 'brand' ? 'bg-gradient-to-br from-[#0D9488] to-[#06B6D4]' : 'bg-gradient-to-br from-[#EC4899] to-[#7C3AED]'}`}>
                          {c.author_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{c.author_name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.user_role === 'brand' ? 'bg-brand/10 text-brand' : 'bg-creator/10 text-creator'}`}>
                          {c.user_role === 'brand' ? 'Brand' : 'Creator'}
                        </span>
                        <span className="text-[10px] text-gray-400">{c._pending ? 'Posting…' : timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed break-words">{c.body}</p>
                    </div>
                    {c.user_id === user?.id && !c._pending && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors self-start mt-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Action bar */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-4 mb-2.5">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={toggleLike}
                  className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 hover:text-red-500'}`}
                >
                  <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                  <span>{formatNumber(likeCount)}</span>
                </motion.button>

                <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  <MessageCircle size={20} />
                  <span>{formatNumber(commentCount)}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="text-gray-500 dark:text-gray-400 hover:text-brand transition-colors"
                >
                  <Share2 size={18} />
                </button>

                <button
                  onClick={async () => {
                    if (!user?.id || savePending) return;
                    const next = !saved;
                    setSaved(next);
                    setSavePending(true);
                    try {
                      if (next) await savePost(user.id, post.id);
                      else await unsavePost(user.id, post.id);
                    } catch { setSaved(!next); }
                    finally { setSavePending(false); }
                  }}
                  className={`ml-auto transition-colors ${saved ? 'text-wallet' : 'text-gray-400 hover:text-wallet'}`}
                >
                  <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Comment input */}
              {user ? (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  {(user.avatar || user.logo) ? (
                    <img src={user.avatar || user.logo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#0D9488] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 rounded-full px-3 py-2 outline-none border-none focus:ring-2 focus:ring-brand/30"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || submitting}
                    className="p-2 rounded-full bg-brand text-white disabled:opacity-30 hover:bg-brand-600 transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </form>
              ) : (
                <p className="text-center text-xs text-gray-400">Sign in to comment</p>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          >
            <X size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
