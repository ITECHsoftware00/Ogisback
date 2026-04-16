import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Star, CheckCircle, Clock, MessageCircle, Zap,
  Heart, Share2, ArrowLeft, Users, TrendingUp, UserPlus
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
import FollowButton from '../components/FollowButton';
import { NicheBadge } from '../components/ui/Badge';
import { formatNumber } from '../lib/normalize';
import { getCreatorByUsername, getCreatorReviews, getFollowerCount } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import SEO, { creatorProfileSchema } from '../components/SEO';

function adaptCreator(row) {
  if (!row) return null;
  return {
    ...row,
    avatar: row.avatar_url || `https://i.pravatar.cc/150?u=${row.id}`,
    cover: row.cover_url || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80',
    totalFollowers: row.total_followers || 0,
    responseTime: row.response_time || '24h',
    isOnline: row.is_online || false,
    verified: row.is_verified || false,
    niche: row.niche || [],
    followers: {
      instagram: row.instagram_followers || 0,
      tiktok: row.tiktok_followers || 0,
      youtube: row.youtube_followers || 0,
    },
    platforms: {
      instagram: row.instagram || null,
      tiktok: row.tiktok || null,
      youtube: row.youtube || null,
    },
    rates: {
      post: row.rate_post || 0,
      reel: row.rate_reel || 0,
      story: row.rate_story || 0,
      video: row.rate_video || 0,
    },
    reviewCount: row.review_count || 0,
    completedOrders: row.completed_orders || 0,
    onTime: row.on_time_rate || 100,
    engagementRate: row.engagement_rate || null,
    rating: row.rating || 0,
  };
}

export default function CreatorPublicProfile() {
  const { username } = useParams();
  const { isBrand, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    getCreatorByUsername(username)
      .then(data => {
        const adapted = adaptCreator(data);
        setCreator(adapted);
        if (adapted?.id) {
          getFollowerCount(adapted.id).then(setFollowerCount).catch(() => {});
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!creator?.id || activeTab !== 'reviews') return;
    setReviewsLoading(true);
    getCreatorReviews(creator.id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [creator?.id, activeTab]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
        <SEO title="Creator Not Found" noindex={true} />
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <p className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">Creator not found</p>
          <p className="text-sm mb-6">@{username} doesn't exist on OgisBack yet.</p>
          <Link to="/explore" className="btn btn-creator btn-md">Browse Creators</Link>
        </div>
      </div>
    );
  }

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
                  {creator.location && <span className="flex items-center gap-1 text-sm text-gray-500"><MapPin size={13} />{creator.location}</span>}
                  <span className="flex items-center gap-1 text-sm text-gray-500"><Clock size={13} />Replies in {creator.responseTime}</span>
                  {creator.isOnline && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Online
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <FollowButton
                  creatorId={creator.id}
                  creatorName={creator.name}
                  onCountChange={d => setFollowerCount(c => Math.max(0, c + d))}
                />
                {isBrand && (
                  <>
                    <button onClick={handleMessage} className="btn btn-outline btn-md"><MessageCircle size={16} /> Message</button>
                    <button onClick={handleHire} className="btn btn-brand btn-md"><Zap size={16} /> Hire Creator</button>
                  </>
                )}
                {!isLoggedIn && (
                  <>
                    <button onClick={handleMessage} className="btn btn-outline btn-md"><MessageCircle size={16} /> Message</button>
                    <button onClick={handleHire} className="btn btn-creator btn-md"><Zap size={16} /> Hire</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            {/* Bio */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">About</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{creator.bio || 'No bio yet.'}</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {creator.niche.map(n => <NicheBadge key={n} niche={n} />)}
              </div>
            </div>

            {/* Stats */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Users size={14} />Social Followers</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{formatNumber(creator.totalFollowers)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><UserPlus size={14} />OgisBack Followers</span>
                  <span className="font-bold text-sm text-brand">{formatNumber(followerCount)}</span>
                </div>
                {creator.engagementRate != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 flex items-center gap-2"><TrendingUp size={14} />Engagement</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{creator.engagementRate}%</span>
                  </div>
                )}
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
            {(creator.platforms.instagram || creator.platforms.youtube || creator.platforms.tiktok) && (
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
            )}

            {/* Rates */}
            {Object.values(creator.rates).some(v => v > 0) && (
              <div className="card p-5">
                <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Rates</h3>
                <div className="space-y-2">
                  {Object.entries(creator.rates).filter(([, v]) => v > 0).map(([type, price]) => (
                    <div key={type} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</span>
                      <span className="font-bold text-sm text-gray-900 dark:text-white">${Number(price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {isBrand && (
                  <button onClick={handleHire} className="btn btn-brand btn-sm w-full mt-4">
                    <Zap size={13} /> Hire for a Campaign
                  </button>
                )}
              </div>
            )}
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
                  {t}
                </button>
              ))}
            </div>

            {activeTab === 'content' && (
              <div className="text-center py-12 text-gray-400 text-sm">No content posted yet.</div>
            )}

            {activeTab === 'reviews' && (
              reviewsLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No reviews yet</p>
                  <p className="text-gray-400 text-sm mt-1">Reviews appear here after brands complete orders with this creator.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div className="card p-4 flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white">{creator.rating.toFixed(1)}</p>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={13} fill={n <= Math.round(creator.rating) ? '#F59E0B' : 'none'} className={n <= Math.round(creator.rating) ? 'text-wallet' : 'text-gray-300'} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{creator.reviewCount} review{creator.reviewCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5,4,3,2,1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-400">{star}</span>
                            <Star size={10} fill="#F59E0B" className="text-wallet flex-shrink-0" />
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-wallet rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-gray-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review list */}
                  {reviews.map(review => (
                    <div key={review.id} className="card p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={review.brand_profiles?.logo_url || `https://i.pravatar.cc/40?u=${review.brand_id}`}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {review.brand_profiles?.name || 'Brand'}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={12} fill={n <= review.rating ? '#F59E0B' : 'none'} className={n <= review.rating ? 'text-wallet' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.review && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.review}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
