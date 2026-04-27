import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Heart, MessageCircle, Users, BarChart3, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getCreatorAnalytics, getCreatorPosts } from '../../lib/db';
import { formatNumber } from '../../lib/normalize';
import { fetchYouTubeStats } from '../../lib/socialApi';
import { useInstagramData } from '../../hooks/useInstagramData';
import DonutChart from '../../components/ui/DonutChart';
import AudienceInsightsCard from '../../components/AudienceInsightsCard';

const PLATFORM_COLORS = { Instagram: '#E1306C', TikTok: '#010101', YouTube: '#FF0000' };
const LOCATION_COLORS = ['#EC4899', '#7C3AED', '#0D9488', '#F59E0B', '#3B82F6'];
const ENG_COLORS      = { Instagram: '#E1306C', TikTok: '#111827', YouTube: '#EF4444' };

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
  </svg>
);
const YouTubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white" />
  </svg>
);

export default function CreatorAnalytics() {
  const { user } = useAuth();
  const { data: igData } = useInstagramData(user?.id);
  const [analytics, setAnalytics]   = useState(null);
  const [myPosts, setMyPosts]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [ytStats, setYtStats]       = useState(null);
  const [apiErrors, setApiErrors]   = useState({});
  const [locationTab, setLocationTab]   = useState(null);
  const [hoveredAudSeg, setHoveredAudSeg] = useState(null);
  const [hoveredEngSeg, setHoveredEngSeg] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getCreatorAnalytics(user.id),
      getCreatorPosts(user.id),
    ]).then(([a, posts]) => {
      setAnalytics(a);
      setMyPosts(posts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  // Fetch live YouTube stats (YouTube Data API — free, no ScrapeCreators)
  useEffect(() => {
    if (!analytics?.youtube) return;
    fetchYouTubeStats(analytics.youtube)
      .then(s => { if (s) setYtStats(s); })
      .catch(err => setApiErrors(p => ({ ...p, youtube: err.message })));
  }, [analytics?.youtube]);

  const totalFollowers = analytics
    ? (analytics.instagram_followers || 0) + (analytics.tiktok_followers || 0) + (analytics.youtube_followers || 0)
    : 0;
  const totalLikes = myPosts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = myPosts.reduce((s, p) => s + (p.comments || 0), 0);
  const totalViews = myPosts.reduce((s, p) => s + (p.views || 0), 0);

  // Compute engagement from Ogisback post data when platform-specific values aren't stored
  const postAvgLikes    = myPosts.length > 0 ? Math.round(totalLikes    / myPosts.length) : 0;
  const postAvgComments = myPosts.length > 0 ? Math.round(totalComments / myPosts.length) : 0;
  const computeEngRate  = (followers, avgL, avgC) =>
    followers > 0 && (avgL + avgC) > 0
      ? parseFloat(((avgL + avgC) / followers * 100).toFixed(2))
      : 0;

  const platforms = analytics ? [
    {
      name: 'Instagram',
      icon: <InstagramIcon />,
      color: 'bg-gradient-to-br from-pink-500 to-purple-600',
      followers: igData?.profile?.followerCount || analytics.instagram_followers || 0,
      engagement: igData?.profile?.engagementRate ?? analytics.instagram_engagement ?? 0,
      avgLikes: igData?.profile?.avgLikes || analytics.instagram_avg_likes || 0,
      avgComments: igData?.profile?.avgComments || analytics.instagram_avg_comments || 0,
      handle: analytics.instagram,
    },
    {
      name: 'TikTok',
      icon: <TikTokIcon />,
      color: 'bg-gradient-to-br from-gray-900 to-gray-700',
      followers: analytics.tiktok_followers || 0,
      avgLikes:    analytics.tiktok_avg_likes    || postAvgLikes,
      avgComments: analytics.tiktok_avg_comments || postAvgComments,
      engagement:  analytics.tiktok_engagement   ||
        computeEngRate(
          analytics.tiktok_followers || 0,
          analytics.tiktok_avg_likes    || postAvgLikes,
          analytics.tiktok_avg_comments || postAvgComments,
        ),
      handle: analytics.tiktok,
    },
    {
      name: 'YouTube',
      icon: <YouTubeIcon />,
      color: 'bg-gradient-to-br from-red-500 to-red-700',
      followers:   ytStats?.subscribers        || analytics.youtube_followers    || 0,
      engagement:  ytStats?.engRate            || analytics.youtube_engagement   || 0,
      avgLikes:    ytStats?.avgLikes           || analytics.youtube_avg_likes    || 0,
      avgComments: ytStats?.avgComments        || analytics.youtube_avg_comments || 0,
      handle: analytics.youtube,
      live: !!ytStats,
    },
  ] : [];

  const engagementChartData = platforms
    .filter(p => p.followers > 0)
    .map(p => ({ platform: p.name, rate: p.engagement }));

  const locationData = analytics?.audience_locations || [];

  // Country code → name helper
  const regionNames = typeof Intl !== 'undefined' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
  const toCountryName = (code) => {
    if (!code || !regionNames) return code;
    try { return regionNames.of(code.toUpperCase()) || code; } catch { return code; }
  };

  // Build per-platform audience location data
  const igLocation = igData?.profile?.cityName
    ? [{ label: igData.profile.cityName, source: 'Instagram', percent: 100, isSingle: true }]
    : igData?.profile?.countryCode
    ? [{ label: toCountryName(igData.profile.countryCode), source: 'Instagram', percent: 100, isSingle: true }]
    : [];

  const ttLocations = locationData.map(d => ({
    label:   d.city || d.country || d.region || 'Unknown',
    percent: Number(d.percent) || 0,
    source:  'TikTok',
  }));
  const ttMax = ttLocations.length > 0 ? Math.max(...ttLocations.map(d => d.percent)) : 1;

  const ttDonutData = ttLocations.slice(0, 5).map((d, i) => ({
    label: d.label, value: d.percent, color: LOCATION_COLORS[i],
  }));

  const connectedPlatforms = platforms.filter(p => p.followers > 0 || p.handle);
  const engDonutData = connectedPlatforms.map(p => ({
    label: p.name,
    value: Math.max(parseFloat(p.engagement) || 0.05, 0.05),
    color: ENG_COLORS[p.name],
  }));
  const avgEng = (() => {
    const c = platforms.filter(p => p.followers > 0);
    if (!c.length) return null;
    return (c.reduce((s, p) => s + (parseFloat(p.engagement) || 0), 0) / c.length).toFixed(2);
  })();

  const ytLocation  = ytStats?.country
    ? [{ label: toCountryName(ytStats.country), source: 'YouTube', percent: 100, isSingle: true }]
    : [];

  // Active platform tab state
  const allLocationPlatforms = [
    ...(ttLocations.length > 0 ? ['TikTok']    : []),
    ...(ytLocation.length  > 0 ? ['YouTube']   : []),
    ...(igLocation.length  > 0 ? ['Instagram'] : []),
  ];

  // Auto-select best location tab when data arrives; reset if active tab loses data
  useEffect(() => {
    if (locationTab && allLocationPlatforms.includes(locationTab)) return;
    if (ttLocations.length > 0) { setLocationTab('TikTok');    return; }
    if (ytStats?.country)       { setLocationTab('YouTube');   return; }
    if (igLocation.length > 0)  { setLocationTab('Instagram'); return; }
    setLocationTab(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttLocations.length, ytStats?.country, igLocation.length, locationTab]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO title="Analytics" noindex={true} />
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 size={22} className="text-primary" />Analytics
        </h1>
        <p className="page-subtitle">Performance insights across your social platforms</p>
      </div>

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Followers" value={formatNumber(totalFollowers)} icon={Users} color="creator" trend="up" />
        <StatCard title="Total Views" value={formatNumber(totalViews)} icon={Eye} color="primary" delay={0.05} />
        <StatCard title="Total Likes" value={formatNumber(totalLikes)} icon={Heart} color="creator" delay={0.1} />
        <StatCard title="Total Comments" value={formatNumber(totalComments)} icon={MessageCircle} color="brand" delay={0.15} />
      </div>

      {/* API error notice (non-blocking) */}
      {apiErrors.youtube && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-300">
          YouTube API: {apiErrors.youtube}
        </div>
      )}

      {/* ── Platform cards ── */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {platforms.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${p.color} rounded-2xl p-5 text-white`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="opacity-90">{p.icon}</span>
              <span className="font-semibold">{p.name}</span>
              {p.live && <span className="ml-1 text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">● LIVE</span>}
              {p.handle && <span className="ml-auto text-white/60 text-xs truncate max-w-[90px]">@{p.handle.replace(/^@/, '')}</span>}
            </div>
            <p className="font-heading font-bold text-3xl mb-1">
              {p.followers > 0 ? formatNumber(p.followers) : '—'}
            </p>
            <p className="text-white/70 text-xs mb-4">followers</p>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20">
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wide">Engagement</p>
                <p className="font-semibold text-sm mt-0.5">
                  {p.engagement > 0 ? `${p.engagement}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wide">Avg Likes</p>
                <p className="font-semibold text-sm mt-0.5">
                  {p.avgLikes > 0 ? formatNumber(p.avgLikes) : '—'}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-[10px] uppercase tracking-wide">Avg Comments</p>
                <p className="font-semibold text-sm mt-0.5">
                  {p.avgComments > 0 ? formatNumber(p.avgComments) : '—'}
                </p>
              </div>
            </div>

            {/* Platform-specific audience data */}
            {p.name === 'TikTok' && locationData.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-white/60 text-[10px] uppercase tracking-wide mb-2">Audience Countries</p>
                <div className="space-y-1.5">
                  {locationData.slice(0, 3).map(d => {
                    const label = d.city || d.country || d.region || 'Unknown';
                    const pct   = d.percent;
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-white/80 text-xs flex-1 truncate">{label}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white/70 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-white/70 text-[10px] w-7 text-right">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {p.name === 'Instagram' && igData?.profile && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-white/60 text-[10px] uppercase tracking-wide mb-2">Account Info</p>
                <div className="space-y-1 text-[11px] text-white/70">
                  {igData.profile.biography && (
                    <p className="truncate">{igData.profile.biography}</p>
                  )}
                  <p>{igData.profile.mediaCount} posts · {igData.profile.isVerified ? '✓ Verified' : 'Public'}</p>
                </div>
              </div>
            )}
            {p.name === 'YouTube' && ytStats && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-white/60 text-[10px] uppercase tracking-wide mb-2">Channel Stats</p>
                <div className="space-y-1 text-[11px] text-white/70">
                  <p>{formatNumber(ytStats.views)} total views</p>
                  <p>{ytStats.videoCount} videos published</p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Engagement + Audience grid ── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Engagement Rate — Circular Arc Gauges */}
        <div className="card p-6 relative overflow-hidden">
          {/* Subtle dot-grid texture */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #00000012 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <div className="dark:block hidden absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title flex items-center gap-2 mb-0">
                <TrendingUp size={16} className="text-primary" />Engagement Rate
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">By Platform</span>
            </div>

            <div className="flex gap-5 items-center">
              {/* Donut chart */}
              <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
                <DonutChart
                  data={engDonutData}
                  size={160}
                  thickness={28}
                  onHover={setHoveredEngSeg}
                  hoveredIdx={hoveredEngSeg}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {hoveredEngSeg !== null && engDonutData[hoveredEngSeg] ? (
                    <>
                      <span className="text-xl font-black leading-none" style={{ color: engDonutData[hoveredEngSeg].color }}>
                        {(parseFloat(platforms.find(p => p.name === engDonutData[hoveredEngSeg].label)?.engagement) || 0).toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">{engDonutData[hoveredEngSeg].label}</span>
                    </>
                  ) : avgEng !== null ? (
                    <>
                      <span className="text-xl font-black text-gray-800 dark:text-gray-200 leading-none">{avgEng}%</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">avg rate</span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-gray-300 dark:text-gray-700">—</span>
                  )}
                </div>
              </div>

              {/* Platform breakdown */}
              <div className="flex-1 space-y-3">
                {platforms.map((p, i) => {
                  const rate = parseFloat(p.engagement) || 0;
                  const color = ENG_COLORS[p.name];
                  const connected = p.followers > 0 || !!p.handle;
                  const engIdx = engDonutData.findIndex(d => d.label === p.name);
                  return (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.15 }}
                      className="flex items-center gap-3 cursor-default"
                      onMouseEnter={() => engIdx >= 0 && setHoveredEngSeg(engIdx)}
                      onMouseLeave={() => setHoveredEngSeg(null)}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150"
                        style={{ background: connected ? color : '#d1d5db', transform: hoveredEngSeg === engIdx ? 'scale(1.5)' : 'scale(1)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                          <span className="text-sm font-black tabular-nums" style={{ color: connected && rate > 0 ? color : '#9ca3af' }}>
                            {connected && rate > 0 ? `${rate.toFixed(2)}%` : '—'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {connected ? `${formatNumber(p.followers)} followers` : 'not connected'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Audience Locations — Multi-platform */}
        <div className="card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <MapPin size={16} className="text-primary" />Audience Locations
            </h2>
            {/* Platform tabs */}
            {allLocationPlatforms.length > 1 && (
              <div className="flex gap-1">
                {allLocationPlatforms.map(p => (
                  <button
                    key={p}
                    onClick={() => setLocationTab(p)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all duration-150 ${
                      locationTab === p
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TikTok audience countries — donut chart */}
          {locationTab === 'TikTok' && ttLocations.length > 0 && (
            <div className="flex gap-5 items-center">
              {/* Donut */}
              <div className="relative flex-shrink-0" style={{ width: 160, height: 160 }}>
                <DonutChart
                  data={ttDonutData}
                  size={160}
                  thickness={26}
                  onHover={setHoveredAudSeg}
                  hoveredIdx={hoveredAudSeg}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {hoveredAudSeg !== null && ttDonutData[hoveredAudSeg] ? (
                    <>
                      <span className="text-xl font-black leading-none" style={{ color: ttDonutData[hoveredAudSeg].color }}>
                        {ttDonutData[hoveredAudSeg].value}%
                      </span>
                      <span className="text-[9px] text-gray-400 text-center leading-tight mt-1 max-w-[64px] truncate">
                        {ttDonutData[hoveredAudSeg].label}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-black text-gray-800 dark:text-gray-200 leading-none">{ttDonutData.length}</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide mt-1">countries</span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2.5">
                {ttDonutData.map((d, i) => (
                  <div
                    key={d.label + i}
                    className="flex items-center gap-2.5 cursor-default"
                    onMouseEnter={() => setHoveredAudSeg(i)}
                    onMouseLeave={() => setHoveredAudSeg(null)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-150"
                      style={{ background: d.color, transform: hoveredAudSeg === i ? 'scale(1.5)' : 'scale(1)' }} />
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{d.label}</span>
                    <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: d.color }}>{d.value}%</span>
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100 dark:border-white/10">
                  TikTok follower data · Sync in Profile Settings
                </p>
              </div>
            </div>
          )}

          {/* YouTube channel country — live */}
          {locationTab === 'YouTube' && ytLocation.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Channel info row */}
              {ytStats?.channelTitle && (
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 text-red-500">
                    <YouTubeIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{ytStats.channelTitle}</p>
                    <p className="text-[11px] text-gray-400">{formatNumber(ytStats.subscribers || 0)} subscribers</p>
                  </div>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full flex-shrink-0">● Live</span>
                </div>
              )}
              {/* Country card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Channel Country</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{ytLocation[0].label}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 mb-1">Total Views</p>
                  <p className="text-lg font-bold text-red-500">{formatNumber(ytStats?.views || 0)}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 pt-1">
                City-level audience data requires YouTube Analytics OAuth — coming soon.
              </p>
            </motion.div>
          )}

          {/* Instagram creator location — live from profile */}
          {locationTab === 'Instagram' && igLocation.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30">
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                  <InstagramIcon />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{igLocation[0].label}</p>
                  <p className="text-xs text-gray-500">Creator location · Live from Instagram</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">● Live</span>
              </div>
            </motion.div>
          )}

          {/* No data at all */}
          {allLocationPlatforms.length === 0 && (
            <div className="h-44 flex flex-col items-center justify-center gap-2">
              <MapPin size={32} className="text-gray-200 dark:text-gray-700" />
              <p className="text-sm text-gray-400 text-center">
                Connect a platform in Profile Settings<br/>to see real audience location data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Audience Insights (unified multi-platform) ── */}
      <div className="mb-6">
        <AudienceInsightsCard analytics={analytics} userId={user?.id} />
      </div>

      {/* ── Top performing posts ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">Top Performing Posts</h2>
          <Link to="/creator/feed" className="text-xs font-semibold text-creator hover:text-creator/80 transition-colors flex items-center gap-1">
            View all <span className="text-base leading-none">→</span>
          </Link>
        </div>
        {myPosts.length > 0 ? (
          <div className="space-y-1">
            {[...myPosts]
              .sort((a, b) => (b.likes || 0) + (b.views || 0) - (a.likes || 0) - (a.views || 0))
              .slice(0, 5)
              .map((post, i) => {
                const hasSrc = post.thumbnail_url || post.media_url;
                const rankMeta = [
                  { color: '#F59E0B', label: '🥇' },
                  { color: '#94A3B8', label: '🥈' },
                  { color: '#C97A44', label: '🥉' },
                  { color: '#8B5CF6', label: null },
                  { color: '#6366F1', label: null },
                ][i] || { color: '#6366F1', label: null };

                const typeCfg = {
                  reel:  { grad: 'from-pink-500 to-purple-600',  text: 'Reel' },
                  video: { grad: 'from-blue-500 to-cyan-500',    text: 'Video' },
                  photo: { grad: 'from-slate-400 to-slate-500',  text: 'Photo' },
                }[post.type] || { grad: 'from-gray-400 to-gray-500', text: post.type || 'Post' };

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.38 }}
                    className="group relative flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all duration-200"
                  >
                    {/* Rank number */}
                    <div className="w-6 flex-shrink-0 text-center">
                      <span
                        className="text-sm font-black leading-none tabular-nums"
                        style={{ color: i < 3 ? rankMeta.color : '#CBD5E1' }}
                      >
                        {i + 1}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div
                      className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                      style={{ boxShadow: i === 0 ? `0 0 0 2px ${rankMeta.color}50, 0 4px 12px ${rankMeta.color}25` : '0 2px 8px rgba(0,0,0,0.08)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-creator/20 to-brand/25" />
                      {hasSrc ? (
                        <img
                          src={hasSrc}
                          alt=""
                          className="w-full h-full object-cover relative z-10"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center relative z-10">
                          <span className="text-xl font-black text-white/30 select-none">
                            {(post.caption || 'P').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Caption + stats */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1.5 group-hover:text-creator transition-colors duration-150">
                        {post.caption || 'No caption'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] font-medium">
                        <span className="flex items-center gap-1 text-pink-500">
                          <Heart size={10} />{formatNumber(post.likes || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <MessageCircle size={10} />{formatNumber(post.comments || 0)}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400">
                          <Eye size={10} />{formatNumber(post.views || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Type badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r flex-shrink-0 ${typeCfg.grad}`}>
                      {typeCfg.text}
                    </span>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
              <BarChart3 size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No posts yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Create content to see performance data here.</p>
            <Link to="/creator/new-post" className="btn btn-creator btn-sm mt-4">Create Post</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
