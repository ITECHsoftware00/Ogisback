import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Share2, Play, Images, Film, MessageCircle } from 'lucide-react';
import { formatNumber, timeAgo } from '../data';
import { useAuth } from '../context/AuthContext';

const typeIcon = { video: Play, carousel: Images, reel: Film, photo: null };
const typeLabel = { video: 'Video', carousel: 'Carousel', reel: 'Reel', photo: 'Photo' };

export default function ContentCard({ post, onHire, onMessage }) {
  const { isLoggedIn, isBrand } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const Icon = typeIcon[post.type];

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="card overflow-hidden group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={post.thumbnail}
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
        {/* Views overlay for videos */}
        {post.views > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-white text-[10px] font-medium">{formatNumber(post.views)} views</span>
          </div>
        )}
        {/* Brand actions overlay */}
        {isBrand && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onMessage && onMessage(post); }}
              className="btn bg-white text-gray-900 btn-sm hover:bg-gray-100"
            >
              <MessageCircle size={14} /> Message
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onHire && onHire(post); }}
              className="btn btn-creator btn-sm"
            >
              Hire
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Creator */}
        <Link to={`/creator/${post.creator?.toLowerCase().replace(' ', '')}`} className="flex items-center gap-2 mb-2" onClick={e => e.stopPropagation()}>
          <img src={post.avatar} alt={post.creator} className="w-6 h-6 rounded-full object-cover" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors">@{post.creator?.toLowerCase().replace(' ', '')}</span>
          <span className="ml-auto text-[10px] text-gray-400">{timeAgo(post.postedDate)}</span>
        </Link>

        {/* Caption */}
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{post.caption}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleLike} className={`flex items-center gap-1 text-xs font-medium transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
              {formatNumber(likeCount)}
            </button>
            <button onClick={() => setSaved(s => !s)} className={`flex items-center gap-1 text-xs font-medium transition-colors ${saved ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
              <Bookmark size={13} fill={saved ? 'currentColor' : 'none'} />
              {formatNumber(post.saves + (saved ? 1 : 0))}
            </button>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Share2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
