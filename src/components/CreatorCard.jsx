import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, CheckCircle, MessageCircle, Zap, Users } from 'lucide-react';
import { formatNumber } from '../lib/normalize';
import { NicheBadge } from './ui/Badge';
import { useAuth } from '../context/AuthContext';
import { saveCreator, unsaveCreator } from '../lib/db';

export default function CreatorCard({ creator, onHire, onMessage, linkPrefix = '/brand/discover' }) {
  const { isBrand, user } = useAuth();
  const [saved,       setSaved]       = useState(false);
  const [savePending, setSavePending] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user?.id || savePending) return;
    const next = !saved;
    setSaved(next);
    setSavePending(true);
    try {
      if (next) await saveCreator(user.id, creator.id);
      else      await unsaveCreator(user.id, creator.id);
    } catch { setSaved(!next); }
    finally   { setSavePending(false); }
  };

  const minRate = creator.rates?.post || creator.rates?.reel || creator.rates?.story || 0;
  const hasVideo = (creator.rates?.video || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/20 via-brand/15 to-creator/20">
        {creator.cover ? (
          <img
            src={creator.cover}
            alt={creator.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="text-5xl font-heading font-black text-white/30 select-none"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {(creator.name || 'C').charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Dark gradient at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* OgisBack watermark */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-md pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#0D9488] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[6px] font-black leading-none">O</span>
          </div>
          <span className="text-white text-[10px] font-bold tracking-wide">OgisBack</span>
        </div>

        {/* Top Creator badge (verified) */}
        {creator.verified && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            <CheckCircle size={9} />
            Top Creator
          </div>
        )}

        {/* Online dot (only when not verified — avoids overlap) */}
        {creator.isOnline && !creator.verified && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-[10px]">Online</span>
          </div>
        )}

        {/* Save / heart — top right (brand only) */}
        {isBrand && (
          <button
            onClick={handleSave}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-10"
          >
            <Heart
              size={14}
              fill={saved ? '#EC4899' : 'none'}
              className={saved ? 'text-creator' : 'text-gray-400'}
            />
          </button>
        )}

        {/* Hover CTA overlay — slides up from bottom */}
        {isBrand && (
          <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out z-10">
            <div className="flex gap-2">
              <button
                onClick={e => { e.stopPropagation(); onMessage && onMessage(creator); }}
                className="flex-1 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white text-xs font-semibold border border-white/25 hover:bg-white/25 transition-colors flex items-center justify-center gap-1"
              >
                <MessageCircle size={11} /> Message
              </button>
              <button
                onClick={e => { e.stopPropagation(); onHire && onHire(creator); }}
                className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
              >
                <Zap size={11} /> Hire
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Creator identity row ── */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0"
          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=7C3AED&color=fff&size=32`; }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={`${linkPrefix}/${creator.username}`}
              className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-brand transition-colors leading-tight"
              onClick={e => e.stopPropagation()}
            >
              {creator.name}
            </Link>
            {creator.plan === 'pro' && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white flex-shrink-0">
                PRO
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">@{creator.username}</p>
        </div>
        {/* Star rating */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Star size={11} fill="#F59E0B" className="text-wallet" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {Number(creator.rating || 5).toFixed(1)}
          </span>
          <span className="text-[10px] text-gray-400 ml-0.5">
            ({formatNumber(creator.reviewCount || 0)})
          </span>
        </div>
      </div>

      {/* ── Bio / service tagline ── */}
      <div className="px-3 pb-2">
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {creator.bio || `Creating ${creator.niche?.[0] || 'content'} that converts for brands of all sizes.`}
        </p>
      </div>

      {/* ── Niche tags ── */}
      {creator.niche?.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {creator.niche.slice(0, 3).map(n => <NicheBadge key={n} niche={n} />)}
        </div>
      )}

      {/* ── Platform follower counts ── */}
      <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
        {creator.followers?.instagram > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-gradient-instagram flex items-center justify-center flex-shrink-0 text-[7px] font-black text-white leading-none">IG</span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{formatNumber(creator.followers.instagram)}</span>
          </div>
        )}
        {creator.followers?.tiktok > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-black flex items-center justify-center flex-shrink-0 text-[7px] font-black text-white leading-none">TK</span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{formatNumber(creator.followers.tiktok)}</span>
          </div>
        )}
        {creator.followers?.youtube > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 text-[7px] font-black text-white leading-none">YT</span>
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{formatNumber(creator.followers.youtube)}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
          <Users size={10} />
          {formatNumber(creator.totalFollowers || 0)}
        </div>
      </div>

      {/* ── Price footer ── */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1.5">
        <span className="text-[10px] text-gray-400">
          {hasVideo ? '🎥 Video available' : ''}
        </span>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 leading-none mb-0.5">Starting from</p>
          <p className="font-heading font-bold text-sm text-gray-900 dark:text-white">
            {minRate > 0 ? `$${minRate.toLocaleString()}` : 'Contact'}
          </p>
        </div>
      </div>

      {/* View Profile (non-brand users — no hover CTA) */}
      {!isBrand && (
        <div className="px-3 pb-3 -mt-1">
          <Link
            to={`${linkPrefix}/${creator.username}`}
            className="btn btn-outline btn-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            View Profile
          </Link>
        </div>
      )}
    </motion.div>
  );
}
