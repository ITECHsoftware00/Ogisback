import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Compass, Images, Star, ChevronDown, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreatorCard from '../../components/CreatorCard';
import ContentCard from '../../components/ContentCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getCreators, getContentPosts, createOrder, getOrCreateConversation } from '../../lib/db';
import { createEscrow, getFeeRate } from '../../lib/payments';
import { normalizeCreator, normalizePost, formatCurrency, formatNumber } from '../../lib/normalize';

/* ── Constants ─────────────────────────────────────────── */
const NICHES = [
  { label: 'All',       emoji: '✦' },
  { label: 'Fashion',   emoji: '👗' },
  { label: 'Beauty',    emoji: '💄' },
  { label: 'Tech',      emoji: '💻' },
  { label: 'Fitness',   emoji: '💪' },
  { label: 'Food',      emoji: '🍕' },
  { label: 'Travel',    emoji: '✈️' },
  { label: 'Finance',   emoji: '💰' },
  { label: 'Lifestyle', emoji: '🌿' },
];

const BUDGET_RANGES = [
  { value: 'Any',      label: 'Any Budget' },
  { value: 'under50',  label: 'Under $50' },
  { value: '50-200',   label: '$50 – $200' },
  { value: '200-500',  label: '$200 – $500' },
  { value: '500plus',  label: '$500+' },
];

const RATING_OPTIONS = [
  { value: 'Any', label: 'Any Rating' },
  { value: '4.5', label: '4.5+ Stars' },
  { value: '4.0', label: '4.0+ Stars' },
];

const SORT_OPTIONS = [
  { value: 'relevance',   label: 'Relevance' },
  { value: 'rating',      label: 'Top Rated' },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
];

const PLATFORMS = ['All', 'Instagram', 'TikTok', 'YouTube'];

/* ── Skeleton loaders ───────────────────────────────────── */
function CreatorSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800" />
      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          </div>
          <div className="w-14 h-4 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
        <div className="flex gap-1">
          <div className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
          <div className="h-5 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-800" />
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ── Shared select style ────────────────────────────────── */
const SELECT_CLS = [
  'h-9 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700',
  'focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand',
  'hover:border-gray-300 cursor-pointer transition-all appearance-none',
  'dark:bg-[#111118] dark:border-gray-700 dark:text-gray-300',
].join(' ');

/* ── Featured mini-card (horizontal scroll row) ─────────── */
function FeaturedCard({ creator, onHire, onMessage }) {
  const { isBrand } = useAuth();
  const minRate = creator.rates?.post || creator.rates?.reel || 0;
  return (
    <div className="flex-shrink-0 w-56 card p-3 hover:shadow-card-hover transition-shadow cursor-pointer">
      <div className="flex items-center gap-2.5 mb-2">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=7C3AED&color=fff&size=40`; }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{creator.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={10} fill="#F59E0B" className="text-wallet" />
            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{Number(creator.rating || 5).toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({formatNumber(creator.reviewCount || 0)})</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
        {creator.niche?.slice(0, 2).join(' · ') || 'Content Creator'}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {minRate > 0 ? `From $${minRate.toLocaleString()}` : 'Contact'}
        </span>
        {isBrand && (
          <button
            onClick={e => { e.stopPropagation(); onHire && onHire(creator); }}
            className="text-xs font-semibold text-brand hover:text-brand-600 transition-colors"
          >
            Hire →
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function BrandDiscover() {
  const { user }    = useAuth();
  const navigate    = useNavigate();

  // Tabs & filters
  const [tab,           setTab]           = useState('creators');
  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [activeNiche,   setActiveNiche]   = useState('All');
  const [activePlatform,setActivePlatform]= useState('All');
  const [budgetFilter,  setBudgetFilter]  = useState('Any');
  const [ratingFilter,  setRatingFilter]  = useState('Any');
  const [sortBy,        setSortBy]        = useState('relevance');
  const [gender,        setGender]        = useState('');
  const [ageRange,      setAgeRange]      = useState([13, 60]);
  const [mapView,       setMapView]       = useState(false);

  // Data
  const [creators,    setCreators]    = useState([]);
  const [content,     setContent]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Hire modal
  const [hireCreator, setHireCreator] = useState(null);
  const [hireNote,    setHireNote]    = useState('');
  const [budget,      setBudget]      = useState('');
  const [hiring,      setHiring]      = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getCreators({ limit: 60 }), getContentPosts({ limit: 60 })])
      .then(([c, posts]) => {
        setCreators(c.map(normalizeCreator));
        setContent(posts.map(normalizePost));
      })
      .catch(err => {
        console.error('Discover load error:', err);
        setError('Failed to load. Please refresh.');
        toast.error('Could not load creators. Check your connection.');
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Filtered + sorted creators ── */
  const filteredCreators = useMemo(() => {
    let list = creators.filter(c => {
      const matchNiche    = activeNiche === 'All' || (c.niche || []).includes(activeNiche);
      const matchSearch   = !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.username?.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = activePlatform === 'All' ||
        (activePlatform === 'Instagram' && c.followers?.instagram > 0) ||
        (activePlatform === 'YouTube'   && c.followers?.youtube   > 0) ||
        (activePlatform === 'TikTok'    && c.followers?.tiktok    > 0);
      const minRate = c.rates?.post || c.rates?.reel || 0;
      const matchBudget = budgetFilter === 'Any' ||
        (budgetFilter === 'under50'  && minRate > 0   && minRate < 50)    ||
        (budgetFilter === '50-200'   && minRate >= 50  && minRate <= 200)  ||
        (budgetFilter === '200-500'  && minRate >= 200 && minRate <= 500)  ||
        (budgetFilter === '500plus'  && minRate > 500);
      const matchRating = ratingFilter === 'Any' || (c.rating || 0) >= parseFloat(ratingFilter);
      const matchGender = !gender || c.gender === gender;
      const matchAge    = (!c.age) || (c.age >= ageRange[0] && c.age <= ageRange[1]);
      return matchNiche && matchSearch && matchPlatform && matchBudget && matchRating && matchGender && matchAge;
    });

    if (sortBy === 'rating')     list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'price_asc')  list = [...list].sort((a, b) => (a.rates?.post || 0) - (b.rates?.post || 0));
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => (b.rates?.post || 0) - (a.rates?.post || 0));
    return list;
  }, [creators, activeNiche, search, activePlatform, budgetFilter, ratingFilter, sortBy]);

  /* Top creators for featured row (top 4 by rating) */
  const featuredCreators = useMemo(() =>
    [...creators]
      .filter(c => (c.rating || 0) > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6),
    [creators]
  );

  const hasActiveFilters = activeNiche !== 'All' || activePlatform !== 'All' || budgetFilter !== 'Any' || ratingFilter !== 'Any' || !!search || !!gender || ageRange[0] !== 13 || ageRange[1] !== 60;

  const clearFilters = () => {
    setActiveNiche('All'); setActivePlatform('All');
    setBudgetFilter('Any'); setRatingFilter('Any');
    setSearch(''); setSearchInput('');
    setGender(''); setAgeRange([13, 60]);
  };

  /* ── Hire ── */
  const handleHire = async () => {
    const amount = parseFloat(budget);
    if (!amount || amount <= 0) { toast.error('Enter a valid budget'); return; }
    if (!user?.id) return;
    if ((user.walletBalance || 0) < amount) {
      toast.error('Insufficient wallet balance — add funds first');
      navigate('/brand/add-funds');
      return;
    }
    setHiring(true);
    try {
      const order = await createOrder({
        creator_id:   hireCreator.id,
        brand_id:     user.id,
        title:        `Direct hire — ${hireCreator.name}`,
        amount,
        deliverables: hireNote ? [hireNote] : [],
        due_date:     null,
        status:       'active',
      });
      await createEscrow({ orderId: order.id, brandId: user.id, creatorId: hireCreator.id, amount, feeRate: getFeeRate(user.plan) });
      toast.success(`Proposal sent to ${hireCreator.name}! Funds are held in escrow.`);
      setHireCreator(null); setBudget(''); setHireNote('');
      navigate('/brand/orders');
    } catch (err) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setHiring(false);
    }
  };

  const handleMessage = async (creator) => {
    if (!user?.id) { navigate('/login'); return; }
    try {
      const conv = await getOrCreateConversation(creator.id, user.id);
      navigate(`/brand/messages/${conv.id}`);
    } catch { navigate('/brand/messages'); }
  };

  /* ── Render ── */
  return (
    <DashboardLayout>
      <SEO title="Discover Creators" noindex={true} />

      {/* ══════════════ SEARCH HERO ══════════════ */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-1">
          Find the perfect creator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {creators.length > 0 ? `${creators.length} verified creators` : 'Browse our verified creator network'}
        </p>

        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-card bg-white dark:bg-[#111118] hover:shadow-card-hover transition-shadow">
          <Search size={18} className="my-auto ml-4 text-gray-400 flex-shrink-0" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            placeholder="Search by name, niche, or platform…"
            className="flex-1 px-3 py-3.5 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          <button
            onClick={() => setSearch(searchInput)}
            className="px-6 py-3.5 bg-brand text-white text-sm font-semibold hover:bg-brand-600 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* ══════════════ NICHE CHIPS ══════════════ */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5">
        {NICHES.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => setActiveNiche(label)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeNiche === label
                ? 'bg-brand text-white shadow-sm'
                : 'bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand hover:text-brand dark:hover:text-brand'
            }`}
          >
            <span>{emoji}</span> {label}
          </button>
        ))}
      </div>

      {/* ══════════════ TABS ══════════════ */}
      <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 mb-5 w-fit">
        <button
          onClick={() => setTab('creators')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'creators' ? 'bg-brand text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          <Compass size={14} /> Creators
        </button>
        <button
          onClick={() => setTab('content')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'content' ? 'bg-brand text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
        >
          <Images size={14} /> Content
        </button>
      </div>

      {/* ══════════════ FILTER BAR + RESULTS COUNT ══════════════ */}
      {tab === 'creators' && (
        <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 flex-shrink-0">Filters:</span>

          {/* Platform */}
          <div className="relative">
            <select
              value={activePlatform}
              onChange={e => setActivePlatform(e.target.value)}
              className={SELECT_CLS}
            >
              {PLATFORMS.map(p => <option key={p} value={p}>{p === 'All' ? 'All Platforms' : p}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Budget */}
          <div className="relative">
            <select value={budgetFilter} onChange={e => setBudgetFilter(e.target.value)} className={SELECT_CLS}>
              {BUDGET_RANGES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Rating */}
          <div className="relative">
            <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} className={SELECT_CLS}>
              {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
            >
              Clear all
            </button>
          )}

          {/* Gender pills */}
          <div className="flex gap-1.5 flex-wrap">
            {[['', 'Any gender'], ['male', 'Male'], ['female', 'Female'], ['non_binary', 'Non-binary']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setGender(val)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  gender === val
                    ? 'bg-brand text-white border-brand'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand/40 hover:text-brand bg-white dark:bg-[#111118]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Age range */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 flex-shrink-0">Age:</span>
            <input
              type="number" min={13} max={99} value={ageRange[0]}
              onChange={e => setAgeRange(r => [Math.min(+e.target.value, r[1] - 1), r[1]])}
              className="w-14 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:bg-[#111118] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <span className="text-xs text-gray-400">–</span>
            <input
              type="number" min={14} max={100} value={ageRange[1]}
              onChange={e => setAgeRange(r => [r[0], Math.max(+e.target.value, r[0] + 1)])}
              className="w-14 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 dark:bg-[#111118] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>


          {/* Results count + sort — pushed to the right */}
          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {filteredCreators.length.toLocaleString()} creator{filteredCreators.length !== 1 ? 's' : ''} found
              </span>
            )}
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={SELECT_CLS}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ══════════════ CREATORS TAB ══════════════ */}
      {tab === 'creators' && (
        <>
          {/* Featured creators banner */}
          {!loading && featuredCreators.length > 0 && !hasActiveFilters && (
            <div className="bg-brand/5 dark:bg-brand/10 border border-brand/15 dark:border-brand/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-brand rounded-full" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Top Creators for your first hire
                </h2>
                <div className="flex items-center gap-1 ml-1">
                  <Star size={11} fill="#F59E0B" className="text-wallet" />
                  <span className="text-[11px] text-gray-500">Highest rated</span>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {featuredCreators.map(c => (
                  <FeaturedCard
                    key={c.id}
                    creator={c}
                    onHire={() => setHireCreator(c)}
                    onMessage={() => handleMessage(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Creator grid or map */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CreatorSkeleton key={i} />)}
            </div>
          ) : mapView ? (
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700" style={{ height: 520 }}>
              <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} attributionControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredCreators.filter(c => c.latitude && c.longitude).map(c => (
                  <Marker key={c.id} position={[c.latitude, c.longitude]}>
                    <Popup>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=7C3AED&color=fff&size=32`; }}
                        />
                        <div>
                          <p className="font-semibold text-xs leading-tight">{c.name}</p>
                          <a href={`/brand/discover/${c.username}`} className="text-[11px] text-blue-600 hover:underline">View profile →</a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : filteredCreators.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No creators found"
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCreators.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.24), duration: 0.3 }}
                >
                  <CreatorCard
                    creator={creator}
                    onHire={() => setHireCreator(creator)}
                    onMessage={() => handleMessage(creator)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════ CONTENT TAB ══════════════ */}
      {tab === 'content' && (
        loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : content.length === 0 ? (
          <EmptyState icon={Images} title="No content yet" description="Creators haven't posted content yet." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {content.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.24), duration: 0.3 }}
              >
                <ContentCard
                  post={post}
                  onHire={() => setHireCreator(post)}
                  onMessage={() => handleMessage(post)}
                />
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* ══════════════ HIRE MODAL ══════════════ */}
      <Modal
        isOpen={!!hireCreator}
        onClose={() => { setHireCreator(null); setBudget(''); setHireNote(''); }}
        title={`Hire ${hireCreator?.name}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-wallet/5 border border-wallet/20 rounded-xl text-xs text-gray-600 dark:text-gray-400">
            💰 Payment held in escrow — released only when you approve the content.
            {user?.walletBalance !== undefined && (
              <span className="ml-1 font-medium text-wallet">Balance: {formatCurrency(user.walletBalance)}</span>
            )}
          </div>
          <div className="form-group">
            <label className="label">Budget (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder={hireCreator?.rates?.post?.toString() || '500'}
                className="input pl-8"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Campaign Brief</label>
            <textarea
              value={hireNote}
              onChange={e => setHireNote(e.target.value)}
              placeholder="Describe the deliverables, tone, and brand guidelines…"
              rows={4}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setHireCreator(null)}
              className="btn btn-outline btn-md flex-1"
              disabled={hiring}
            >
              Cancel
            </button>
            <button
              onClick={handleHire}
              disabled={hiring}
              className="btn btn-brand btn-md flex-1 disabled:opacity-60"
            >
              {hiring ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </span>
              ) : 'Send Proposal'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
