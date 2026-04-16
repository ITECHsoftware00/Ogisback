import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Star } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import SEO from '../components/SEO';
import FollowButton from '../components/FollowButton';
import { NicheBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { getFollowing, getFollowers, getCreatorProfile } from '../lib/db';
import { normalizeCreator, formatNumber } from '../lib/normalize';

/* ── Skeleton row ── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
      <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
  );
}

/* ── Creator row card ── */
function CreatorRow({ creator, isCreator: _isCreatorRole, delay = 0 }) {
  const c = normalizeCreator(creator);
  const minRate = c.rates?.post || c.rates?.reel || c.rates?.story || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      {/* Avatar */}
      <Link to={`/creator/${c.username}`} className="flex-shrink-0">
        <img
          src={c.avatar}
          alt={c.name}
          className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm"
          onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=7C3AED&color=fff&size=48`; }}
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/creator/${c.username}`}
            className="font-semibold text-sm text-gray-900 dark:text-white hover:text-brand transition-colors truncate"
          >
            {c.name}
          </Link>
          {c.plan === 'pro' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white flex-shrink-0">PRO</span>
          )}
          {c.verified && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">✓ Verified</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-1">@{c.username}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {c.niche?.slice(0, 2).map(n => <NicheBadge key={n} niche={n} />)}
          {c.totalFollowers > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Users size={10} /> {formatNumber(c.totalFollowers)}
            </span>
          )}
          {c.rating > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Star size={10} fill="#F59E0B" className="text-wallet" />
              {Number(c.rating).toFixed(1)}
            </span>
          )}
          {minRate > 0 && (
            <span className="text-[11px] text-gray-400">from ${minRate.toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* Follow button */}
      <div className="flex-shrink-0">
        <FollowButton creatorId={c.id} creatorName={c.name} size="sm" />
      </div>
    </motion.div>
  );
}

/* ── Follower row (simpler — we only have user_id, not full profile yet) ── */
function FollowerRow({ followerId, delay = 0 }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getCreatorProfile(followerId)
      .then(setProfile)
      .catch(() => {}); // follower may be a brand — no creator_profile
  }, [followerId]);

  // If no creator profile found, show a generic avatar
  const name = profile?.name || 'OgisBack User';
  const avatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=U&background=7C3AED&color=fff&size=48`;
  const username = profile?.username;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex-shrink-0">
        {username ? (
          <Link to={`/creator/${username}`}>
            <img src={avatar} alt={name} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
          </Link>
        ) : (
          <img src={avatar} alt={name} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {username ? (
          <Link to={`/creator/${username}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:text-brand transition-colors block truncate">
            {name}
          </Link>
        ) : (
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{name}</p>
        )}
        {username && <p className="text-xs text-gray-400">@{username}</p>}
        {profile?.niche?.length > 0 && (
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {profile.niche.slice(0, 2).map(n => <NicheBadge key={n} niche={n} />)}
          </div>
        )}
      </div>
      {/* Follow back button — only if they're a creator */}
      {username && profile?.id && (
        <div className="flex-shrink-0">
          <FollowButton creatorId={profile.id} creatorName={name} size="sm" />
        </div>
      )}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════ */

export default function FollowingPage() {
  const { user, activeRole } = useAuth();
  const isCreator = activeRole === 'creator';

  const [tab,            setTab]            = useState('following');
  const [search,         setSearch]         = useState('');
  const [following,      setFollowing]      = useState([]);
  const [followers,      setFollowers]      = useState([]);
  const [loadingFollow,  setLoadingFollow]  = useState(true);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  /* Load "Following" list */
  useEffect(() => {
    if (!user?.id) return;
    setLoadingFollow(true);
    getFollowing(user.id)
      .then(setFollowing)
      .catch(() => {})
      .finally(() => setLoadingFollow(false));
  }, [user?.id]);

  /* Load "Followers" list when creator switches to that tab */
  useEffect(() => {
    if (tab !== 'followers' || !isCreator || !user?.id) return;
    setLoadingFollowers(true);
    getFollowers(user.id)
      .then(setFollowers)
      .catch(() => {})
      .finally(() => setLoadingFollowers(false));
  }, [tab, isCreator, user?.id]);

  const filteredFollowing = following.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = isCreator
    ? [{ id: 'following', label: 'Following', count: following.length }, { id: 'followers', label: 'Followers', count: null }]
    : [{ id: 'following', label: 'Following', count: following.length }];

  return (
    <DashboardLayout>
      <SEO title="Following" noindex={true} />

      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users size={22} className="text-brand" />
            Following
          </h1>
          <p className="page-subtitle">
            {isCreator
              ? `${following.length} following · manage your connections`
              : `${following.length} creators you follow`}
          </p>
        </div>
        <Link to="/brand/discover" className="btn btn-brand btn-md">
          <UserPlus size={15} /> Discover Creators
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white dark:bg-[#111118] rounded-xl p-1 border border-gray-100 dark:border-gray-800 mb-5 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-brand text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search (following tab only) */}
      {tab === 'following' && (
        <div className="relative max-w-sm mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators you follow…"
            className="input pl-9"
          />
        </div>
      )}

      {/* Content */}
      <div className="card divide-y divide-gray-50 dark:divide-gray-800/60">
        <AnimatePresence mode="wait">

          {/* ── Following tab ── */}
          {tab === 'following' && (
            <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loadingFollow ? (
                [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
              ) : filteredFollowing.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                    <UserPlus size={28} className="text-brand" />
                  </div>
                  <p className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-1">
                    {search ? 'No results' : "You're not following anyone yet"}
                  </p>
                  <p className="text-sm text-gray-500 mb-5">
                    {search ? 'Try a different search.' : 'Follow creators to see their content and updates here.'}
                  </p>
                  <Link to="/explore" className="btn btn-brand btn-md">Browse Creators</Link>
                </div>
              ) : (
                filteredFollowing.map((c, i) => (
                  <CreatorRow key={c.id} creator={c} delay={Math.min(i * 0.04, 0.2)} />
                ))
              )}
            </motion.div>
          )}

          {/* ── Followers tab (creator only) ── */}
          {tab === 'followers' && isCreator && (
            <motion.div key="followers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loadingFollowers ? (
                [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
              ) : followers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-creator/10 flex items-center justify-center mb-4">
                    <Users size={28} className="text-creator" />
                  </div>
                  <p className="font-heading font-bold text-gray-900 dark:text-white text-lg mb-1">No followers yet</p>
                  <p className="text-sm text-gray-500 mb-5">Complete your profile and post content to attract followers.</p>
                  <Link to="/creator/profile/edit" className="btn btn-creator btn-md">Edit Profile</Link>
                </div>
              ) : (
                followers.map((f, i) => (
                  <FollowerRow key={f.follower_id} followerId={f.follower_id} delay={Math.min(i * 0.04, 0.2)} />
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
