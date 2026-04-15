import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Images, Film } from 'lucide-react';
import { formatNumber, timeAgo } from '../lib/normalize';
import { useAuth } from '../context/AuthContext';
import { togglePostLike, checkPostLiked } from '../lib/db';
import PostComments from './PostComments';

const typeIcon  = { video: Play, carousel: Images, reel: Film, photo: null };
const typeLabel = { video: 'Video', carousel: 'Carousel', reel: 'Reel', photo: 'Photo' };

export default function ContentCard({ post, onHire, onMessage }) {
  const { user, isBrand } = useAuth();
  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(post.likes   || 0);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [showComments, setShowComments] = useState(false);
  const Icon = typeIcon[post.type];

  /* Check if current user already liked this post */
  useEffect(() => {
    if (!user?.id) return;
    checkPostLiked(post.id, user.id)
      .then(setLiked)
      .catch(() => {});
  }, [post.id, user?.id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user?.id) return;
    const next = !liked;
    /* Optimistic */
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
    try {
      await togglePostLike(post.id, user.id);
    } catch {
      /* Revert */
      setLiked(!next);
      setLikeCount(c => next ? c - 1 : c + 1);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/creator/${post.username || post.creator}`;
    if (navigator.share) {
      navigator.share({ title: post.caption || 'Check this out', url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="card overflow-hidden group cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={post.thumbnail || post.media_url}
            alt={post.caption}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Watermark */}
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gradient-creator flex items-center justify-center">
              <span className="text-white text-[7px] font-bold">O</span>
            </div>
            <span className="text-white text-[10px] font-medium">OgisBack</span>
          </div>

          {/* Type badge */}
          {Icon && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <Icon size={11} className="text-white" />
              <span className="text-white text-[10px] font-medium">{typeLabel[post.type]}</span>
            </div>
          )}

          {/* Views */}
          {post.views > 0 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="text-white text-[10px] font-medium">{formatNumber(post.views)} views</span>
            </div>
          )}

          {/* Brand hover actions */}
          {isBrand && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={e => { e.stopPropagation(); onMessage?.(post); }}
                className="btn bg-white text-gray-900 btn-sm hover:bg-gray-100"
              >
                <MessageCircle size={14} /> Message
              </button>
              <button
                onClick={e => { e.stopPropagation(); onHire?.(post); }}
                className="btn btn-creator btn-sm"
              >
                Hire
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Creator row */}
          <Link
            to={`/creator/${post.username || post.creator?.toLowerCase().replace(/\s+/g, '')}`}
            className="flex items-center gap-2 mb-2"
            onClick={e => e.stopPropagation()}
          >
            <img src={post.avatar} alt={post.creator} className="w-6 h-6 rounded-full object-cover" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">
              @{post.username || post.creator?.toLowerCase().replace(/\s+/g, '')}
            </span>
            <span className="ml-auto text-[10px] text-gray-400">{timeAgo(post.postedDate || post.created_at)}</span>
          </Link>

          {/* Caption */}
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{post.caption}</p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-medium transition-all ${liked ? 'text-red-500 scale-110' : 'text-gray-500 hover:text-red-500'}`}
            >
              <motion.div
                key={liked ? 'liked' : 'unliked'}
                initial={{ scale: liked ? 0.6 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
              </motion.div>
              <span>{formatNumber(likeCount)}</span>
            </button>

            {/* Comments */}
            <button
              onClick={e => { e.stopPropagation(); setShowComments(true); }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary transition-colors"
            >
              <MessageCircle size={15} />
              <span>{formatNumber(commentCount)}</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Comments drawer */}
      {showComments && (
        <PostComments
          post={post}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentCount(c => c + 1)}
        />
      )}
    </>
  );
}
