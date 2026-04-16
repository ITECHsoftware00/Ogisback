import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Images, Film, Bookmark, Maximize2 } from 'lucide-react';
import { formatNumber, timeAgo } from '../lib/normalize';
import { useAuth } from '../context/AuthContext';
import { togglePostLike, checkPostLiked, savePost, unsavePost, checkPostSaved } from '../lib/db';
import PostComments from './PostComments';
import PostDetailModal from './PostDetailModal';
import FollowButton from './FollowButton';

const TYPE_ICON  = { video: Play, carousel: Images, reel: Film, photo: null };
const TYPE_LABEL = { video: 'Video', carousel: 'Carousel', reel: 'Reel', photo: 'Photo' };

export default function ContentCard({ post, onHire, onMessage }) {
  const { user } = useAuth();
  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(post.likes    || 0);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [showComments, setShowComments] = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [savePending,  setSavePending]  = useState(false);
  const TypeIcon = TYPE_ICON[post.type];

  useEffect(() => {
    if (!user?.id) return;
    checkPostLiked(post.id, user.id).then(setLiked).catch(() => {});
    checkPostSaved(user.id, post.id).then(setSaved).catch(() => {});
  }, [post.id, user?.id]);

  const toggleLike = async (e) => {
    e.stopPropagation();
    if (!user?.id) return;
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : Math.max(0, c - 1));
    try { await togglePostLike(post.id, user.id); }
    catch {
      setLiked(!next);
      setLikeCount(c => next ? c - 1 : c + 1);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/creator/${post.username || post.creator}`;
    if (navigator.share) navigator.share({ title: post.caption || '', url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  };

  const thumb       = post.thumbnail || post.media_url;
  const handle      = `@${post.username || (post.creator || '').toLowerCase().replace(/\s+/g, '')}`;
  const profilePath = `/creator/${post.username || (post.creator || '').toLowerCase().replace(/\s+/g, '')}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card overflow-hidden group cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={thumb}
            alt={post.caption || ''}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
            onError={e => { e.currentTarget.src = 'https://placehold.co/400x300/1a1a2e/7C3AED?text=No+Preview'; }}
          />

          {/* Expand hint on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <Maximize2 size={15} className="text-gray-700" />
            </div>
          </div>

          {/* Type badge */}
          {TypeIcon && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none">
              <TypeIcon size={10} className="text-white" />
              <span className="text-white text-[10px] font-semibold">{TYPE_LABEL[post.type]}</span>
            </div>
          )}

          {/* Views */}
          {post.views > 0 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full pointer-events-none">
              <span className="text-white text-[10px] font-semibold">{formatNumber(post.views)} views</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3">
          {/* Creator row */}
          <Link
            to={profilePath}
            className="flex items-center gap-2 mb-2"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={post.avatar}
              alt={post.creator || ''}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.creator || 'C')}&background=7C3AED&color=fff&size=28`; }}
            />
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 hover:text-brand transition-colors">
              {handle}
            </span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {timeAgo(post.postedDate || post.created_at)}
            </span>
          </Link>

          {/* Caption */}
          {post.caption && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
              {post.caption}
            </p>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
              <span>{formatNumber(likeCount)}</span>
            </button>

            <button
              onClick={e => { e.stopPropagation(); setShowModal(true); }}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand transition-colors"
            >
              <MessageCircle size={13} />
              <span>{formatNumber(commentCount)}</span>
            </button>

            {/* Follow button — stops card click */}
            <div onClick={e => e.stopPropagation()}>
              <FollowButton
                creatorId={post.creator_id}
                creatorName={post.creator}
                size="sm"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
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
                className={`transition-colors ${saved ? 'text-wallet' : 'text-gray-400 hover:text-wallet'}`}
              >
                <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
              </button>
              <button onClick={handleShare} className="text-gray-400 hover:text-brand transition-colors">
                <Share2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full post detail modal */}
      {showModal && (
        <PostDetailModal
          post={{ ...post, likes: likeCount, comments: commentCount }}
          onClose={() => setShowModal(false)}
          onHire={onHire}
          onMessage={onMessage}
        />
      )}

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
