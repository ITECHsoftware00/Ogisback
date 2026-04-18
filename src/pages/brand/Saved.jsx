import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked, Search, X, LayoutGrid, List,
  SlidersHorizontal, Star, Users, Zap, MessageCircle, Trash2, Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import CreatorCard from '../../components/CreatorCard';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getSavedCreators, unsaveCreator, getOrCreateConversation } from '../../lib/db';
import { normalizeCreator, formatNumber } from '../../lib/normalize';
import { NicheBadge } from '../../components/ui/Badge';

const SORT_OPTIONS = [
  { value: 'saved',     label: 'Recently saved' },
  { value: 'followers', label: 'Most followers' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc',label: 'Price: High to Low' },
  { value: 'rating',    label: 'Top rated' },
];

function CardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800" />
      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full w-2/3" />
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-full" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-4/5" />
        <div className="flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListRow({ creator, onRemove, onMessage, onHire }) {
  const minRate = creator.rates?.post || creator.rates?.reel || creator.rates?.story || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="w-12 h-12 rounded-2xl object-cover"
          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=7C3AED&color=fff&size=48`; }}
        />
        {creator.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-[#111118]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <Link
            to={`/brand/discover/${creator.username}`}
            className="font-semibold text-sm text-gray-900 dark:text-white hover:text-brand transition-colors"
          >
            {creator.name}
          </Link>
          <div className="flex items-center gap-0.5">
            <Star size={10} fill="#F59E0B" className="text-yellow-400" />
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{Number(creator.rating || 5).toFixed(1)}</span>
          </div>
          {creator.niche?.slice(0, 2).map(n => <NicheBadge key={n} niche={n} />)}
        </div>
        <p className="text-xs text-gray-500 truncate">{creator.bio || `@${creator.username}`}</p>
      </div>

      {/* Followers */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
        <Users size={13} />
        <span className="font-semibold">{formatNumber(creator.totalFollowers || 0)}</span>
      </div>

      {/* Price */}
      <div className="hidden sm:block text-right flex-shrink-0">
        <p className="text-[10px] text-gray-400">from</p>
        <p className="font-bold text-sm text-gray-900 dark:text-white">
          {minRate > 0 ? `$${minRate.toLocaleString()}` : 'Contact'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onMessage(creator)}
          className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/[0.07] text-gray-500 flex items-center justify-center hover:bg-brand/10 hover:text-brand transition-all"
          title="Message"
        >
          <MessageCircle size={14} />
        </button>
        <button
          onClick={() => onHire(creator)}
          className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          title="Hire"
        >
          <Zap size={14} />
        </button>
        <button
          onClick={() => onRemove(creator.id)}
          className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
          title="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function BrandSaved() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [search, setSearch]   = useState('');
  const [saved,  setSaved]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,   setView]     = useState('grid'); // 'grid' | 'list'
  const [sort,   setSort]     = useState('saved');
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getSavedCreators(user.id)
      .then(data => setSaved(data.map(normalizeCreator)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() => {
    let list = saved.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'followers') list = [...list].sort((a, b) => (b.totalFollowers || 0) - (a.totalFollowers || 0));
    if (sort === 'price_asc') list = [...list].sort((a, b) => {
      const pa = a.rates?.post || a.rates?.reel || 0;
      const pb = b.rates?.post || b.rates?.reel || 0;
      return pa - pb;
    });
    if (sort === 'price_desc') list = [...list].sort((a, b) => {
      const pa = a.rates?.post || a.rates?.reel || 0;
      const pb = b.rates?.post || b.rates?.reel || 0;
      return pb - pa;
    });
    if (sort === 'rating') list = [...list].sort((a, b) => (b.rating || 5) - (a.rating || 5));
    return list;
  }, [saved, search, sort]);

  const totalFollowers = saved.reduce((s, c) => s + (c.totalFollowers || 0), 0);

  const handleRemove = async (creatorId) => {
    setSaved(s => s.filter(c => c.id !== creatorId));
    try {
      await unsaveCreator(user.id, creatorId);
      toast.success('Removed from saved');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleMessage = async (creator) => {
    try {
      const conv = await getOrCreateConversation(creator.id, user.id);
      navigate(`/brand/messages/${conv.id}`);
    } catch { navigate('/brand/messages'); }
  };

  const handleHire = (creator) => navigate(`/brand/discover/${creator.username}`);

  return (
    <DashboardLayout>
      <SEO title="Saved Creators" noindex={true} />

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-brand/10 via-primary/5 to-creator/10 border border-brand/10 dark:border-brand/10 p-6">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 bg-creator/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center">
                <Heart size={16} className="text-brand" fill="currentColor" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Saved Creators</h1>
            </div>
            <p className="text-sm text-gray-500">Your shortlist of {saved.length} creators · {formatNumber(totalFollowers)} total reach</p>
          </div>
          <Link to="/brand/discover" className="btn btn-brand btn-md self-start sm:self-auto gap-2">
            <Search size={15} /> Browse More
          </Link>
        </div>

        {/* Stats row */}
        {!loading && saved.length > 0 && (
          <div className="relative flex gap-4 mt-5 pt-4 border-t border-brand/10">
            {[
              { label: 'Saved', value: saved.length },
              { label: 'Total Reach', value: formatNumber(totalFollowers) },
              { label: 'Avg Rating', value: (saved.reduce((s, c) => s + (c.rating || 5), 0) / saved.length).toFixed(1) + ' ★' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-lg font-heading font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search saved creators…"
            className="w-full bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] rounded-xl pl-10 pr-9 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand/25 focus:border-brand/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setShowSort(o => !o)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
              sort !== 'saved'
                ? 'bg-brand/10 border-brand/30 text-brand'
                : 'bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.07] text-gray-600 dark:text-gray-300 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal size={14} />
            {SORT_OPTIONS.find(o => o.value === sort)?.label}
          </button>
          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-11 w-48 card shadow-glass p-1.5 z-20"
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setShowSort(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      sort === opt.value
                        ? 'bg-brand/10 text-brand font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View toggle */}
        <div className="flex rounded-xl border border-gray-200 dark:border-white/[0.07] overflow-hidden bg-white dark:bg-white/[0.04]">
          <button
            onClick={() => setView('grid')}
            className={`p-2 transition-colors ${view === 'grid' ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 transition-colors ${view === 'list' ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="creator-grid">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={saved.length === 0 ? 'No saved creators yet' : 'No results'}
          description={saved.length === 0 ? 'Heart creators while browsing to add them to your shortlist.' : 'Try a different search or clear filters.'}
          action={<Link to="/brand/discover" className="btn btn-brand btn-md">Discover Creators</Link>}
        />
      ) : view === 'grid' ? (
        <div className="creator-grid">
          <AnimatePresence>
            {filtered.map((creator, i) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04 }}
                className="relative group"
              >
                <CreatorCard
                  creator={creator}
                  onHire={() => handleHire(creator)}
                  onMessage={() => handleMessage(creator)}
                  linkPrefix="/brand/discover"
                />
                <button
                  onClick={() => handleRemove(creator.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all opacity-0 group-hover:opacity-100 z-20"
                  title="Remove from saved"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-gray-50 dark:divide-white/[0.04]">
          <AnimatePresence>
            {filtered.map((creator) => (
              <ListRow
                key={creator.id}
                creator={creator}
                onRemove={handleRemove}
                onMessage={handleMessage}
                onHire={handleHire}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </DashboardLayout>
  );
}
