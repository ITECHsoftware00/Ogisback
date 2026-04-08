import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Eye, Heart, MessageCircle, Users, BarChart3, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getCreatorAnalytics, getCreatorPosts } from '../../lib/db';
import { formatNumber } from '../../lib/normalize';

const PLATFORM_COLORS = { Instagram: '#E1306C', TikTok: '#010101', YouTube: '#FF0000' };
const LOCATION_COLORS = ['#EC4899', '#7C3AED', '#0D9488', '#F59E0B', '#3B82F6'];

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
  const [analytics, setAnalytics] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const totalFollowers = analytics
    ? (analytics.instagram_followers || 0) + (analytics.tiktok_followers || 0) + (analytics.youtube_followers || 0)
    : 0;
  const totalLikes = myPosts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = myPosts.reduce((s, p) => s + (p.comments || 0), 0);
  const totalViews = myPosts.reduce((s, p) => s + (p.views || 0), 0);

  const platforms = analytics ? [
    {
      name: 'Instagram',
      icon: <InstagramIcon />,
      color: 'bg-gradient-to-br from-pink-500 to-purple-600',
      followers: analytics.instagram_followers || 0,
      engagement: analytics.instagram_engagement || 0,
      avgLikes: analytics.instagram_avg_likes || 0,
      avgComments: analytics.instagram_avg_comments || 0,
      handle: analytics.instagram,
    },
    {
      name: 'TikTok',
      icon: <TikTokIcon />,
      color: 'bg-gradient-to-br from-gray-900 to-gray-700',
      followers: analytics.tiktok_followers || 0,
      engagement: analytics.tiktok_engagement || 0,
      avgLikes: analytics.tiktok_avg_likes || 0,
      avgComments: analytics.tiktok_avg_comments || 0,
      handle: analytics.tiktok,
    },
    {
      name: 'YouTube',
      icon: <YouTubeIcon />,
      color: 'bg-gradient-to-br from-red-500 to-red-700',
      followers: analytics.youtube_followers || 0,
      engagement: analytics.youtube_engagement || 0,
      avgLikes: analytics.youtube_avg_likes || 0,
      avgComments: analytics.youtube_avg_comments || 0,
      handle: analytics.youtube,
    },
  ] : [];

  const engagementChartData = platforms
    .filter(p => p.followers > 0)
    .map(p => ({ platform: p.name, rate: p.engagement }));

  const locationData = analytics?.audience_locations || [];

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
              {p.handle && <span className="ml-auto text-white/60 text-xs">@{p.handle}</span>}
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
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* ── Engagement rate chart ── */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />Engagement Rate by Platform
          </h2>
          {engagementChartData.length > 0 ? (
            <div className="h-48" style={{ minHeight: '192px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementChartData} barSize={40}>
                  <XAxis dataKey="platform" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={v => [`${v}%`, 'Engagement Rate']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '13px' }}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                    {engagementChartData.map((entry) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] || '#7C3AED'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
              <BarChart3 size={32} className="opacity-30" />
              <p>Add your platform stats in Profile Edit</p>
            </div>
          )}
        </div>

        {/* ── Audience location ── */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2">
            <MapPin size={16} className="text-primary" />Audience Location
          </h2>
          {locationData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="h-44 w-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={locationData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="percent">
                      {locationData.map((_, i) => <Cell key={i} fill={LOCATION_COLORS[i % LOCATION_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [`${v}%`, n]}
                      contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 flex-1">
                {locationData.slice(0, 5).map((d, i) => (
                  <div key={d.country} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: LOCATION_COLORS[i] }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{d.country}</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
              <MapPin size={32} className="opacity-30" />
              <p>Add audience locations in Profile Edit</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Top performing posts ── */}
      <div className="card p-6">
        <h2 className="section-title">Top Performing Posts</h2>
        {myPosts.length > 0 ? (
          <div className="space-y-3">
            {myPosts
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .slice(0, 5)
              .map((post, i) => (
                <div key={post.id} className="flex items-center gap-3">
                  <span className="text-2xl font-heading font-extrabold text-gray-200 dark:text-gray-700 w-8">#{i + 1}</span>
                  <img
                    src={post.thumbnail_url || post.media_url || `https://picsum.photos/48?u=${post.id}`}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{post.caption || 'No caption'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ❤ {formatNumber(post.likes || 0)} · 💬 {formatNumber(post.comments || 0)} · 👁 {formatNumber(post.views || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {post.platform && (
                      <span className="text-[10px] text-gray-400">{post.platform}</span>
                    )}
                    <span className={`badge ${post.type === 'reel' ? 'badge-creator' : post.type === 'video' ? 'badge-primary' : 'badge-gray'} text-[10px]`}>
                      {post.type}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No posts yet. Add your content to see performance data.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
