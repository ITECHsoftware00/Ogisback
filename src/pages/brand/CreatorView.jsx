import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, CheckCircle, MessageCircle, Zap,
  Clock, Users, TrendingUp, Heart, Eye, Grid3x3, Instagram,
  Youtube, Video, BookOpen, BarChart3,
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
import { createEscrow, getFeeRate } from '../../lib/payments';
import { normalizeCreator, formatNumber, formatCurrency } from '../../lib/normalize';
import { timeAgo } from '../../lib/normalize';

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square cursor-pointer"
    >
      {thumb && !imgError ? (
        isVideo ? (
          <video src={thumb} className="w-full h-full object-cover" muted preload="metadata" />
        ) : (
          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)} />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          <Grid3x3 size={28} className="text-gray-400" />
        </div>
      )}

      {/* Type badge */}
      {isVideo && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
          VIDEO
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
        <span className="flex items-center gap-1 text-white text-sm font-semibold">
          <Heart size={14} className="fill-white" /> {formatNumber(post.likes || 0)}
        </span>
        <span className="flex items-center gap-1 text-white text-sm font-semibold">
          <Eye size={14} /> {formatNumber(post.views || 0)}
        </span>
      </div>
    </motion.div>
  );
}

export default function BrandCreatorView() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [creator,  setCreator]  = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('content');

  const [hireModal, setHireModal] = useState(false);
  const [budget,    setBudget]    = useState('');
  const [brief,     setBrief]     = useState('');
  const [hiring,    setHiring]    = useState(false);

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
        // Only show published posts to brands
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
        <div className="h-44 rounded-3xl bg-gray-100 dark:bg-gray-800" />
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
    { icon: Instagram, label: 'Instagram', value: creator.followers?.instagram, color: 'text-pink-500' },
    { icon: Video,     label: 'TikTok',    value: creator.followers?.tiktok,    color: 'text-gray-800 dark:text-white' },
    { icon: Youtube,   label: 'YouTube',   value: creator.followers?.youtube,   color: 'text-red-500' },
  ].filter(p => p.value);

  return (
    <DashboardLayout>
      <SEO title={`${creator.name} — Creator Profile`} noindex />

      <div className="max-w-5xl mx-auto">
        <Link to="/brand/discover"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors mb-5">
          <ArrowLeft size={15} /> Back to Discover
        </Link>

        {/* Cover */}
        <div className="relative h-44 rounded-3xl overflow-hidden mb-4 bg-gradient-to-r from-brand/30 to-primary/30">
          {creator.cover_url && (
            <img src={creator.cover_url} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Avatar + name row */}
        <div className="flex items-end gap-4 -mt-10 mb-6 px-2">
          <div className="relative flex-shrink-0">
            <img src={creator.avatar} alt=""
              className="w-20 h-20 rounded-2xl border-4 border-white dark:border-[#0A0A0F] object-cover shadow-lg" />
            {creator.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                <CheckCircle size={12} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 pb-1">
            <h1 className="font-heading font-bold text-xl text-gray-900 dark:text-white leading-tight">
              {creator.name}
            </h1>
            <p className="text-sm text-gray-500">@{creator.username}</p>
          </div>
          <div className="flex gap-2 pb-1">
            <button onClick={handleMessage} className="btn btn-outline btn-sm gap-1.5">
              <MessageCircle size={14} /> Message
            </button>
            <button onClick={() => setHireModal(true)} className="btn btn-brand btn-sm gap-1.5">
              <Zap size={14} /> Hire
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left sidebar ── */}
          <div className="space-y-4">

            {/* About */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">About</h3>
              {creator.bio ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                  {creator.bio}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No bio added yet.</p>
              )}
              {(creator.location || creator.response_time) && (
                <div className="mt-3 space-y-1.5">
                  {creator.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={12} /> {creator.location}
                    </div>
                  )}
                  {creator.response_time && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} /> Replies in {creator.response_time}
                    </div>
                  )}
                </div>
              )}
              {(creator.niche || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(creator.niche || []).map(n => <NicheBadge key={n} niche={n} />)}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Users size={13} />Total Reach</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{formatNumber(totalFollowers)}</span>
                </div>
                {platforms.map(p => (
                  <div key={p.label} className="flex justify-between items-center">
                    <span className={`text-sm flex items-center gap-2 ${p.color}`}>
                      <p.icon size={13} /> {p.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatNumber(p.value)}</span>
                  </div>
                ))}
                {creator.engagement_rate != null && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-500 flex items-center gap-2"><TrendingUp size={13} />Engagement</span>
                    <span className="font-bold text-sm text-green-600">{creator.engagement_rate}%</span>
                  </div>
                )}
                {creator.rating != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 flex items-center gap-2"><Star size={13} />Rating</span>
                    <span className="font-bold text-sm text-amber-500">
                      {creator.rating} <span className="text-gray-400 font-normal">({creator.review_count || 0})</span>
                    </span>
                  </div>
                )}
                {creator.completed_orders != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Orders done</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{creator.completed_orders}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rates */}
            {(creator.rate_post || creator.rate_reel || creator.rate_story || creator.rate_video) && (
              <div className="card p-5">
                <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">Rates (USD)</h3>
                <div className="space-y-0">
                  {[['Post', creator.rate_post], ['Reel', creator.rate_reel], ['Story', creator.rate_story], ['Video', creator.rate_video]]
                    .filter(([, v]) => v)
                    .map(([t, v]) => (
                      <div key={t} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0 text-sm">
                        <span className="text-gray-500">{t}</span>
                        <span className="font-bold text-gray-900 dark:text-white">${Number(v).toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <button onClick={() => setHireModal(true)} className="btn btn-brand btn-lg w-full gap-2">
              <Zap size={16} /> Hire {creator.name.split(' ')[0]}
            </button>
          </div>

          {/* ── Main content area ── */}
          <div className="lg:col-span-2">

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-2xl p-1 mb-5">
              {[
                { id: 'content', label: `Content`, count: posts.length },
                { id: 'reviews', label: 'Reviews', count: reviews.length },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    tab === t.id
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* Content tab */}
              {tab === 'content' && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {posts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {posts.map(p => <PostCard key={p.id} post={p} />)}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <BarChart3 size={24} className="text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No content posted yet.</p>
                      <p className="text-sm text-gray-400">This creator hasn't published any content on OgisBack.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reviews tab */}
              {tab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map(r => (
                        <div key={r.id} className="card p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                              {r.brand_profiles?.logo_url
                                ? <img src={r.brand_profiles.logo_url} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                                    {(r.brand_profiles?.name?.[0] || 'B').toUpperCase()}
                                  </div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {r.brand_profiles?.name || 'Brand'}
                                </p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <StarRow rating={r.rating} />
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
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Star size={24} className="text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">No reviews yet.</p>
                      <p className="text-sm text-gray-400">Be the first to work with {creator.name.split(' ')[0]}!</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Hire modal */}
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
