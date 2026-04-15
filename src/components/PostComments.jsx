import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getPostComments, addPostComment, deletePostComment } from '../lib/db';
import { timeAgo } from '../lib/normalize';

export default function PostComments({ post, onClose, onCommentAdded }) {
  const { user, activeRole } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    getPostComments(post.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [post.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [comments.length]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const body = input.trim();
    if (!body || !user?.id || submitting) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '40px';

    // Optimistic
    const tempId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempId,
      post_id: post.id,
      user_id: user.id,
      user_role: activeRole,
      author_name: user.name || 'You',
      author_avatar: user.avatar || user.logo || null,
      body,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setComments(prev => [...prev, tempComment]);
    onCommentAdded?.();

    try {
      const saved = await addPostComment(
        post.id,
        user.id,
        activeRole,
        body,
        user.name || 'User',
        user.avatar || user.logo || null
      );
      setComments(prev => prev.map(c => c.id === tempId ? saved : c));
    } catch {
      setComments(prev => prev.filter(c => c.id !== tempId));
      setInput(body);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await deletePostComment(commentId);
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = '40px';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        key="drawer"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111118] rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h3 className="font-heading font-bold text-gray-900 dark:text-white">Comments</h3>
            <p className="text-xs text-gray-400 mt-0.5">{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Post preview */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 flex-shrink-0">
          <img
            src={post.thumbnail || post.media_url}
            alt=""
            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">@{post.username || post.creator}</p>
            <p className="text-xs text-gray-500 line-clamp-1">{post.caption || 'No caption'}</p>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-hide">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No comments yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to comment</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className={`flex gap-3 ${c._pending ? 'opacity-60' : ''}`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {c.author_avatar ? (
                    <img src={c.author_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${c.user_role === 'brand' ? 'bg-gradient-brand' : 'bg-gradient-creator'}`}>
                      {c.author_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{c.author_name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.user_role === 'brand' ? 'bg-brand/10 text-brand' : 'bg-creator/10 text-creator'}`}>
                      {c.user_role === 'brand' ? 'Brand' : 'Creator'}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">{c._pending ? 'Posting…' : timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">{c.body}</p>
                </div>
                {/* Delete (own comments only) */}
                {c.user_id === user?.id && !c._pending && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex-shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors self-start mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-3">
          {user ? (
            <div className="flex items-end gap-2">
              {/* User avatar */}
              {(user.avatar || user.logo) ? (
                <img src={user.avatar || user.logo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${activeRole === 'brand' ? 'bg-gradient-brand' : 'bg-gradient-creator'}`}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder="Add a comment…"
                rows={1}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 rounded-2xl px-4 py-2.5 resize-none outline-none border-none focus:ring-2 focus:ring-creator/30 overflow-hidden"
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || submitting}
                className={`p-2.5 rounded-xl text-white disabled:opacity-30 transition-all flex-shrink-0 ${activeRole === 'brand' ? 'bg-brand hover:bg-brand-600' : 'bg-creator hover:bg-creator-600'}`}
              >
                <Send size={16} />
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-2">Sign in to comment</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
