import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, CheckCircle, MessageCircle, Zap,
  Clock, Users, TrendingUp, Heart, Eye, Grid3x3,
  Camera, PlayCircle, Video, BarChart3, Quote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { NicheBadge } from '../../components/ui/Badge';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import {
  getCreatorByUsername, getCreatorPosts, createOrder,
  getOrCreateConversation, getCreatorReviews,
} from '../../lib/db';
import { fetchTikTokFollowers } from '../../lib/socialApi';
import { createEscrow, getFeeRate } from '../../lib/payments';
import { normalizeCreator, formatNumber, formatCurrency } from '../../lib/normalize';
import { timeAgo } from '../../lib/normalize';

/* ─── sub-components ─────────────────────────────────────── */

function StarRow({ rating, size = 13 }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'} />
      ))}
    </div>
  );
}

function PostCard({ post }) {
  const isVideo = post.type === 'reel' || post.type === 'video';
  const [imgError, setImgError] = useState(false);
  const thumb = post.thumbnail_url || post.media_url;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square cursor-pointer"
    >
      {thumb && !imgError ? (
        isVideo ? (
          <video src={thumb} className="w-full h-full object-cover" muted preload="metadata" />
        ) : (
          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)} />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <Grid3x3 size={26} className="text-gray-400" />
        </div>
      )}

      {isVideo && (
        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide">
          VIDEO
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-3">
        <span className="flex items-center gap-1 text-white text-xs font-semibold">
          <Heart size={12} className="fill-white" /> {formatNumber(post.likes || 0)}
        </span>
        <span className="flex items-center gap-1 text-white text-xs font-semibold">
          <Eye size={12} /> {formatNumber(post.views || 0)}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── main component ──────────────────────────────────────── */

export default function BrandCreatorView() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [creator,   setCreator]   = useState(null);
  const [posts,     setPosts]     = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('content');

  const [hireModal, setHireModal] = useState(false);
  const [budget,    setBudget]    = useState('');
  const [brief,     setBrief]     = useState('');
  const [hiring,    setHiring]    = useState(false);

  const [ttFollowers,  setTtFollowers]  = useState([]);
  const [ttTotal,      setTtTotal]      = useState(0);
  const [ttHasMore,    setTtHasMore]    = useState(false);
  const [ttMinTime,    setTtMinTime]    = useState(null);
  const [ttLoading,    setTtLoading]    = useState(false);
  const [ttLoaded,     setTtLoaded]     = useState(false);

  const regionDisplay = new Intl.DisplayNames(['en'], { type: 'region' });
  const toCountry = (code) => { try { return regionDisplay.of(code) || code; } catch { return code; } };

  const loadTTFollowers = (handle, minTime = null) => {
    if (!handle || ttLoading) return;
    setTtLoading(true);
    fetchTikTokFollowers({ handle, minTime })
      .then(r => {
        const newFollowers = r?.followers ?? [];
        setTtFollowers(prev => minTime ? [...prev, ...newFollowers] : newFollowers);
        setTtTotal(r?.total ?? 0);
        setTtHasMore(r?.has_more ?? false);
        setTtMinTime(r?.min_time ?? null);
        setTtLoaded(true);
      })
      .catch(() => { setTtLoaded(true); })
      .finally(() => setTtLoading(false));
  };

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getCreatorByUsername(username)
      .then(async data => {
        const norm = normalizeCreator(data);
        setCreator(norm);
        const [p, r] = await Promise.all([
          getCreatorPosts(data.id).catch(() => []),
          getCreatorReviews(data.id).catch(() => []),
        ]);
        setPosts(p.filter(post => post.status === 'published'));
        setReviews(r);
      })
      .catch(() => setCreator(null))
      .finally(() => setLoading(false));
  }, [username]);

  const handleHire = async () => {
    const amount = parseFloat(budget);
    if (!amount) { toast.error('Enter a budget'); return; }
    setHiring(true);
    try {
      const order = await createOrder({
        creator_id: creator.id, brand_id: user.id,
        title: `Direct hire — ${creator.name}`,
        amount, deliverables: brief ? [brief] : [], due_date: null, status: 'active',
      });
      await createEscrow({ orderId: order.id, brandId: user.id, creatorId: creator.id, amount, feeRate: getFeeRate(user?.plan) });
      toast.success('Proposal sent! Funds held in escrow.');
      setHireModal(false); setBudget(''); setBrief('');
      navigate('/brand/orders');
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setHiring(false); }
  };

  const handleMessage = async () => {
    if (!user?.id || !creator?.id) return;
    try {
      const conv = await getOrCreateConversation(creator.id, user.id);
      navigate(`/brand/messages/${conv.id}`);
    } catch { navigate('/brand/messages'); }
  };

  /* ── skeleton ── */
  if (loading) return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto animate-pulse space-y-4">
        <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-full" />
        <div className="h-56 rounded-3xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="grid lg:grid-cols-3 gap-6 mt-4">
          <div className="space-y-4">
            <div className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="lg:col-span-2 h-80 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </DashboardLayout>
  );

  if (!creator) return (
    <DashboardLayout>
      <div className="text-center py-24">
        <p className="font-heading font-bold text-xl mb-4">Creator not found</p>
        <Link to="/brand/discover" className="btn btn-brand btn-md">Back to Discover</Link>
      </div>
    </DashboardLayout>
  );

  const totalFollowers = (creator.followers?.instagram || 0) + (creator.followers?.tiktok || 0) + (creator.followers?.youtube || 0);
  const platforms = [
    { icon: Camera,     label: 'Instagram', value: creator.followers?.instagram, color: 'bg-pink-500',  text: 'text-pink-500'  },
    { icon: Video,      label: 'TikTok',    value: creator.followers?.tiktok,    color: 'bg-gray-800 dark:bg-white',  text: 'text-gray-700 dark:text-gray-300' },
    { icon: PlayCircle, label: 'YouTube',   value: creator.followers?.youtube,   color: 'bg-red-500',   text: 'text-red-500'   },
  ].filter(p => p.value);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : creator.rating;

  const heroStats = [
    { label: 'Total Reach',  value: formatNumber(totalFollowers), icon: Users,       color: 'text-brand' },
    { label: 'Engagement',   value: creator.engagement_rate ? `${creator.engagement_rate}%` : '—', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Rating',       value: avgRating ? `${avgRating} ★` : '—', icon: Star, color: 'text-amber-400' },
    { label: 'Campaigns',    value: creator.completed_orders ?? '—', icon: Zap,       color: 'text-primary' },
  ];

  const hasRates = creator.rate_post || creator.rate_reel || creator.rate_story || creator.rate_video;

  return (
    <DashboardLayout>
      <SEO title={`${creator.name} — Creator Profile`} noindex />

      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link to="/brand/discover"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors mb-5">
          <ArrowLeft size={15} /> Back to explore
        </Link>

        {/* ── Hero cover ── */}
        <div className="relative h-52 sm:h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-brand/40 via-primary/30 to-creator/40">
          {creator.cover_url && (
            <img src={creator.cover_url} alt="" className="w-full h-full object-cover" />
          )}
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Name + handle overlay at bottom-left of cover */}
          <div className="absolute bottom-4 left-[104px] sm:left-[120px] right-4 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-white leading-tight drop-shadow">
                  {creator.name}
                </h1>
                {creator.isVerified && (
                  <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/30">
                    <CheckCircle size={10} /> Verified
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm mt-0.5">@{creator.username}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={handleMessage}
                className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/30 transition-all">
                <MessageCircle size={14} /> Message
              </button>
              <button onClick={() => setHireModal(true)}
                className="flex items-center gap-1.5 bg-brand hover:bg-brand/90 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg transition-all">
                <Zap size={14} /> Hire Creator
              </button>
            </div>
          </div>
        </div>

        {/* ── Avatar overlapping cover ── */}
        <div className="flex items-end gap-4 -mt-12 mb-5 px-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white dark:border-[#0A0A0F] shadow-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              {creator.avatar
                ? <img src={creator.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center font-heading font-bold text-2xl text-gray-400">
                    {creator.name?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
            {creator.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#0A0A0F]">
                <CheckCircle size={13} className="text-white" />
              </div>
            )}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            {creator.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                <MapPin size={11} /> {creator.location}
              </span>
            )}
            {creator.response_time && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                <Clock size={11} /> Replies in {creator.response_time}
              </span>
            )}
            {(creator.niche || []).map(n => <NicheBadge key={n} niche={n} />)}
          </div>
        </div>

        {/* ── Hero stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {heroStats.map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0 ${s.color}`}>
                <s.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-gray-900 dark:text-white text-base leading-tight">{s.value}</p>
                <p className="text-[11px] text-gray-400 truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Body: sidebar + main ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left sidebar ── */}
          <div className="space-y-4">

            {/* About */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-sm text-gray-900 dark:text-white mb-3 uppercase tracking-wide">About</h3>
              {creator.bio ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {creator.bio}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No bio added yet.</p>
              )}
            </div>

            {/* Platform reach */}
            {platforms.length > 0 && (
              <div className="card p-5">
                <h3 className="font-heading font-semibold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Platform Reach</h3>
                <div className="space-y-3.5">
                  {platforms.map(p => {
                    const pct = totalFollowers > 0 ? Math.round((p.value / totalFollowers) * 100) : 0;
                    return (
                      <div key={p.label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`flex items-center gap-1.5 text-xs font-semibold ${p.text}`}>
                            <p.icon size={12} /> {p.label}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{formatNumber(p.value)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${p.color}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audience Cities */}
            {creator.audience_locations?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-heading font-semibold text-sm text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Top Cities</h3>
                <div className="space-y-2.5">
                  {creator.audience_locations.slice(0, 5).map((loc, i) => {
                    const label = loc.city || loc.country;
                    const colors = ['bg-pink-500', 'bg-violet-500', 'bg-teal-500', 'bg-amber-500', 'bg-blue-500'];
                    return (
                      <div key={label || i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400 truncate pr-2">{label}</span>
                          <span className="font-semibold text-gray-900 dark:text-white flex-shrink-0">{loc.percent}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${loc.percent}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                            className={`h-full rounded-full ${colors[i % colors.length]}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rates */}
            {hasRates && (
              <div className="card p-5">
                <h3 className="font-heading font-semibold text-sm text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Rates (USD)</h3>
                <div className="space-y-0">
                  {[['Post', creator.rate_post], ['Reel', creator.rate_reel], ['Story', creator.rate_story], ['Video', creator.rate_video]]
                    .filter(([, v]) => v)
                    .map(([t, v]) => (
                      <div key={t} className="flex justify-between py-2.5 border-b border-gray-50 dark:border-gray-800/80 last:border-0 text-sm">
                        <span className="text-gray-500">{t}</span>
                        <span className="font-bold text-gray-900 dark:text-white">${Number(v).toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Hire CTA */}
            <button onClick={() => setHireModal(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand to-primary text-white font-semibold text-sm shadow-lg hover:shadow-brand/30 hover:opacity-95 transition-all flex items-center justify-center gap-2">
              <Zap size={15} /> Hire {creator.name.split(' ')[0]}
            </button>
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-2">

            {/* Tab bar */}
            <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 mb-5">
              {[
                { id: 'content',   label: 'Content',   count: posts.length },
                { id: 'reviews',   label: 'Reviews',   count: reviews.length },
                ...(creator?.tiktok ? [{ id: 'followers', label: 'TikTok Followers', count: null }] : []),
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    if (t.id === 'followers' && !ttLoaded && creator?.tiktok) {
                      loadTTFollowers(creator.tiktok);
                    }
                  }}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all ${
                    tab === t.id ? 'text-brand' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                      tab === t.id ? 'bg-brand/10 text-brand' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {t.id === 'followers' ? formatNumber(t.count) : t.count}
                    </span>
                  )}
                  {tab === t.id && (
                    <motion.div layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand" />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* Content tab */}
              {tab === 'content' && (
                <motion.div key="content"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {posts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {posts.map(p => <PostCard key={p.id} post={p} />)}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <BarChart3 size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">No content posted yet</p>
                        <p className="text-sm text-gray-400 mt-1">This creator hasn't published any content yet.</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reviews tab */}
              {tab === 'reviews' && (
                <motion.div key="reviews"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map(r => (
                        <div key={r.id} className="card p-5 relative overflow-hidden">
                          {/* Background quote decoration */}
                          <Quote size={48} className="absolute top-3 right-4 text-gray-100 dark:text-gray-800 rotate-180" />

                          <div className="flex items-start gap-3 relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 shadow-sm">
                              {r.brand_profiles?.logo_url
                                ? <img src={r.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                    {(r.brand_profiles?.name?.[0] || 'B').toUpperCase()}
                                  </div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {r.brand_profiles?.name || 'Brand'}
                                </p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                    <Star size={10} className="text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{r.rating}</span>
                                  </div>
                                  <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                                </div>
                              </div>
                              {r.review && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.review}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Star size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">No reviews yet</p>
                        <p className="text-sm text-gray-400 mt-1">Be the first to work with {creator.name.split(' ')[0]}!</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Followers tab */}
              {tab === 'followers' && (
                <motion.div key="followers"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {ttLoading && ttFollowers.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-7 h-7 border-2 border-gray-200 dark:border-gray-700 border-t-brand rounded-full animate-spin" />
                    </div>
                  ) : ttFollowers.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-400">
                        Showing {ttFollowers.length.toLocaleString()} of {formatNumber(ttTotal)} followers
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ttFollowers.map(f => (
                          <div key={f.uid}
                            className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.02] hover:border-brand/30 transition-colors">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                              {f.avatar ? (
                                <img src={f.avatar} alt="" className="w-full h-full object-cover"
                                  onError={e => { e.currentTarget.style.display = 'none'; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                  {(f.nickname || f.handle || '?')[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                                {f.nickname || f.handle}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">@{f.handle}</p>
                            </div>
                            {/* Meta */}
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {f.region && (
                                <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                  {toCountry(f.region)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {ttHasMore && (
                        <button
                          onClick={() => loadTTFollowers(creator.tiktok, ttMinTime)}
                          disabled={ttLoading}
                          className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                        >
                          {ttLoading ? 'Loading…' : 'Load more followers'}
                        </button>
                      )}
                    </div>
                  ) : ttLoaded ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Users size={24} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No followers data available</p>
                    </div>
                  ) : null}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Hire modal ── */}
      <Modal isOpen={hireModal} onClose={() => setHireModal(false)} title={`Hire ${creator.name}`}>
        <div className="space-y-4">
          <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl text-xs text-gray-600 dark:text-gray-400">
            Your payment is held in secure escrow until you approve the delivered content.
          </div>
          <div className="form-group">
            <label className="label">Budget (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                placeholder={(creator.rate_post || 500).toString()} className="input pl-8" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Campaign Brief</label>
            <textarea value={brief} onChange={e => setBrief(e.target.value)}
              placeholder="Describe deliverables, tone, and brand guidelines…"
              rows={4} className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setHireModal(false)} className="btn btn-outline btn-md flex-1">Cancel</button>
            <button onClick={handleHire} disabled={hiring} className="btn btn-brand btn-md flex-1">
              {hiring ? 'Sending…' : 'Send Proposal'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
