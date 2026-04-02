import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, CheckCircle, MessageCircle, Zap } from 'lucide-react';
import { formatNumber } from '../data';
import { NicheBadge } from './ui/Badge';
import { useAuth } from '../context/AuthContext';

export default function CreatorCard({ creator, onHire, onMessage, linkPrefix = '/creator' }) {
  const { isBrand } = useAuth();
  const mainPlatform = Object.entries(creator.followers).find(([, v]) => v === Math.max(...Object.values(creator.followers)));
  const mainFollowers = mainPlatform ? mainPlatform[1] : creator.totalFollowers;

  return (
    <motion.div
      whileHover={{ y: -3, shadow: '0 12px 48px rgba(0,0,0,0.12)' }}
      className="card-hover overflow-hidden"
    >
      {/* Cover */}
      <div className="relative h-28 overflow-hidden">
        <img src={creator.cover} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {creator.verified && (
          <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle size={10} /> Verified
          </div>
        )}
        {creator.isOnline && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-[10px]">Online</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Avatar + name */}
        <div className="flex items-start gap-3 -mt-8 mb-3">
          <img src={creator.avatar} alt={creator.name} className="w-14 h-14 rounded-2xl border-2 border-white dark:border-gray-900 object-cover shadow-md" />
          <div className="pt-6 min-w-0">
            <h3 className="font-heading font-bold text-sm text-gray-900 dark:text-white truncate">{creator.name}</h3>
            <p className="text-xs text-gray-500">@{creator.username}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin size={12} /> {creator.location}
        </div>

        {/* Bio */}
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{creator.bio}</p>

        {/* Niches */}
        <div className="flex flex-wrap gap-1 mb-3">
          {creator.niche.slice(0, 3).map(n => <NicheBadge key={n} niche={n} />)}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-t border-b border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <p className="font-heading font-bold text-sm text-gray-900 dark:text-white">{formatNumber(creator.totalFollowers)}</p>
            <p className="text-[10px] text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-heading font-bold text-sm text-gray-900 dark:text-white">{creator.engagementRate}%</p>
            <p className="text-[10px] text-gray-500">Engagement</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5">
              <Star size={11} fill="#F59E0B" className="text-wallet" />
              <p className="font-heading font-bold text-sm text-gray-900 dark:text-white">{creator.rating}</p>
            </div>
            <p className="text-[10px] text-gray-500">{creator.reviewCount} reviews</p>
          </div>
        </div>

        {/* Starting rate */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">Starting from</span>
          <span className="font-heading font-bold text-sm text-gray-900 dark:text-white">${creator.rates.post.toLocaleString()}</span>
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          {isBrand ? (
            <>
              <button
                onClick={() => onMessage && onMessage(creator)}
                className="btn btn-outline btn-sm flex-1"
              >
                <MessageCircle size={13} /> Message
              </button>
              <button
                onClick={() => onHire && onHire(creator)}
                className="btn btn-brand btn-sm flex-1"
              >
                <Zap size={13} /> Hire
              </button>
            </>
          ) : (
            <Link to={`${linkPrefix}/${creator.username}`} className="btn btn-outline btn-sm w-full">
              View Profile
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
