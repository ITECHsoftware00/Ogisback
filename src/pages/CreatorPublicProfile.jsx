import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Star, CheckCircle, Clock, MessageCircle, Zap,
  Heart, Share2, ArrowLeft, Users, TrendingUp
} from 'lucide-react';

const InstagramIcon = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YoutubeIcon = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white"/>
  </svg>
);
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import ContentCard from '../components/ContentCard';
import { NicheBadge } from '../components/ui/Badge';
import { creators, contentFeed, formatNumber } from '../data';
import { useAuth } from '../context/AuthContext';
import SEO, { creatorProfileSchema } from '../components/SEO';

export default function CreatorPublicProfile() {
  const { username } = useParams();
  const { isBrand, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const creator = creators.find(c => c.username === username) || creators[0];
  const posts = contentFeed.filter(p => p.creatorId === creator.id);

  const handleHire = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    toast.success(`Opening hire flow for ${creator.name}!`);
    navigate('/brand/discover');
  };
  const handleMessage = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    toast.success('Opening conversation...');
    navigate('/brand/messages');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <SEO
        title={`${creator.name} — ${creator.niche?.[0] || 'Creator'} on OgisBack`}
        description={creator.bio || `${creator.name} is a content creator on OgisBack with ${formatNumber(creator.totalFollowers)} followers. Available for brand collaborations.`}
        image={creator.avatar}
        url={`/creator/${creator.username}`}
        type="profile"
        structuredData={creatorProfileSchema({
          name: creator.name,
          username: creator.username,
          bio: creator.bio,
          avatar: creator.avatar,
          followers: creator.totalFollowers,
          rating: creator.rating,
        })}
      />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link to="/explore" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to explore
        </Link>

        {/* Cover */}
        <div className="relative h-48 sm:h-64 rounded-3xl overflow-hidden mb-6">
          <img src={creator.cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8 -mt-16 px-2">
          <img src={creator.avatar} alt={creator.name} className="w-24 h-24 rounded-3xl border-4 border-white dark:border-[#0A0A0F] object-cover shadow-lg relative z-10" />
          <div className="flex-1 pt-12 sm:pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{creator.name}</h1>
                  {creator.verified && <CheckCircle size={18} className="text-primary fill-primary/10" />}
                </div>
                <p className="text-gray-500 text-sm">@{creator.username}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={13} />{creator.location}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500"><Clock size={13} />Replies in {creator.responseTime}</span>
                  {creator.isOnline && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Online
                    </span>
                  )}
                </div>
              </div>
              {isBrand && (
                <div className="flex gap-2">
                  <button onClick={handleMessage} className="btn btn-outline btn-md"><MessageCircle size={16} /> Message</button>
                  <button onClick={handleHire} className="btn btn-brand btn-md"><Zap size={16} /> Hire Creator</button>
                </div>
              )}
              {!isLoggedIn && (
                <div className="flex gap-2">
                  <button onClick={handleMessage} className="btn btn-outline btn-md"><MessageCircle size={16} /> Message</button>
                  <button onClick={handleHire} className="btn btn-creator btn-md"><Zap size={16} /> Hire</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Bio */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">About</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{creator.bio}</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {creator.niche.map(n => <NicheBadge key={n} niche={n} />)}
              </div>
            </div>

            {/* Stats */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Users size={14} />Total Followers</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{formatNumber(creator.totalFollowers)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><TrendingUp size={14} />Engagement</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{creator.engagementRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Star size={14} />Rating</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1"><Star size={13} fill="#F59E0B" className="text-wallet" />{creator.rating} ({creator.reviewCount})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Completed Orders</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{creator.completedOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">On-time delivery</span>
                  <span className="font-bold text-sm text-green-600">{creator.onTime}%</span>
                </div>
              </div>
            </div>

            {/* Platforms */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Platforms</h3>
              <div className="space-y-3">
                {creator.platforms.instagram && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-instagram flex items-center justify-center">
                        <InstagramIcon size={14} className="text-white" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">@{creator.platforms.instagram}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(creator.followers.instagram)}</span>
                  </div>
                )}
                {creator.platforms.youtube && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <YoutubeIcon size={14} className="text-red-600" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{creator.platforms.youtube}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(creator.followers.youtube)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rates */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Rates</h3>
              <div className="space-y-2">
                {Object.entries(creator.rates).map(([type, price]) => (
                  <div key={type} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">${price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {isBrand && (
                <button onClick={handleHire} className="btn btn-brand btn-sm w-full mt-4">
                  <Zap size={13} /> Hire for a Campaign
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-2">
            <div className="flex gap-1 mb-6 bg-white dark:bg-[#111118] rounded-xl p-1 border border-gray-100 dark:border-gray-800">
              {['content', 'reviews'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === t ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}
                >
                  {t === 'content' ? `Content (${posts.length})` : 'Reviews'}
                </button>
              ))}
            </div>

            {activeTab === 'content' && (
              posts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {posts.map(p => <ContentCard key={p.id} post={p} onHire={handleHire} onMessage={handleMessage} />)}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">No content posted yet.</div>
              )
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {[
                  { brand: 'NovaSkin', rating: 5, comment: 'Priya delivered exceptional content that truly resonated with our audience. Very professional, on time, and understood our brief perfectly.', date: 'July 2025' },
                  { brand: 'StyleHaus', rating: 5, comment: 'Amazing collaboration! The content exceeded our expectations and drove real results. Would work with her again in a heartbeat.', date: 'June 2025' },
                  { brand: 'Wanderlust Co', rating: 4, comment: 'Great creator, very responsive. Slight delay but the final output was worth the wait.', date: 'May 2025' },
                ].map((r, i) => (
                  <div key={i} className="card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{r.brand}</p>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={13} fill={j < r.rating ? '#F59E0B' : 'none'} className={j < r.rating ? 'text-wallet' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">"{r.comment}"</p>
                    <p className="text-xs text-gray-400">{r.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
