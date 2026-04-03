import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Eye, Heart, Bookmark, Users, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import { contentFeed, earningsHistory, formatNumber } from '../../data';
import SEO from '../../components/SEO';

const COLORS = ['#EC4899', '#7C3AED', '#0D9488', '#F59E0B'];
const nicheData = [
  { name: 'Fashion', value: 45 }, { name: 'Lifestyle', value: 30 },
  { name: 'Beauty', value: 15 }, { name: 'Travel', value: 10 },
];
const growthData = [
  { month: 'Feb', followers: 278000 }, { month: 'Mar', followers: 295000 },
  { month: 'Apr', followers: 308000 }, { month: 'May', followers: 322000 },
  { month: 'Jun', followers: 356000 }, { month: 'Jul', followers: 401000 },
];
const engagementData = [
  { day: 'Mon', rate: 4.2 }, { day: 'Tue', rate: 5.1 }, { day: 'Wed', rate: 4.8 },
  { day: 'Thu', rate: 6.3 }, { day: 'Fri', rate: 7.1 }, { day: 'Sat', rate: 8.2 }, { day: 'Sun', rate: 5.9 },
];
const myPosts = contentFeed.filter(p => p.creatorId === 'c1');
const totalViews = myPosts.reduce((s, p) => s + p.views, 0);
const totalLikes = myPosts.reduce((s, p) => s + p.likes, 0);
const totalSaves = myPosts.reduce((s, p) => s + p.saves, 0);

export default function CreatorAnalytics() {
  return (
    <DashboardLayout>
      <SEO title="Analytics" noindex={true} />
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><BarChart3 size={22} className="text-primary" />Analytics</h1>
        <p className="page-subtitle">Performance insights for your content and profile</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Followers" value={formatNumber(401000)} icon={Users} color="creator" trend="up" trendValue={14} />
        <StatCard title="Total Views" value={formatNumber(totalViews)} icon={Eye} color="primary" trend="up" trendValue={22} delay={0.05} />
        <StatCard title="Total Likes" value={formatNumber(totalLikes)} icon={Heart} color="creator" trend="up" trendValue={8} delay={0.1} />
        <StatCard title="Total Saves" value={formatNumber(totalSaves)} icon={Bookmark} color="brand" trend="up" trendValue={31} delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Follower growth */}
        <div className="card p-6">
          <h2 className="section-title">Follower Growth</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v)} />
                <Tooltip formatter={v => [formatNumber(v), 'Followers']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '13px' }} />
                <Line type="monotone" dataKey="followers" stroke="#EC4899" strokeWidth={2.5} dot={{ fill: '#EC4899', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement rate */}
        <div className="card p-6">
          <h2 className="section-title">Daily Engagement Rate</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} barSize={28}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={v => [`${v}%`, 'Engagement']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '13px' }} />
                <Bar dataKey="rate" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audience breakdown */}
        <div className="card p-6">
          <h2 className="section-title">Content Breakdown</h2>
          <div className="flex items-center gap-6">
            <div className="h-44 w-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={nicheData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {nicheData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {nicheData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{d.name}</span>
                  <span className="ml-auto font-semibold text-sm text-gray-900 dark:text-white">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top performing posts */}
        <div className="card p-6">
          <h2 className="section-title">Top Performing Posts</h2>
          <div className="space-y-3">
            {myPosts.sort((a, b) => b.likes - a.likes).slice(0, 3).map((post, i) => (
              <div key={post.id} className="flex items-center gap-3">
                <span className="text-2xl font-heading font-extrabold text-gray-200 dark:text-gray-700 w-8">#{i + 1}</span>
                <img src={post.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{post.caption}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">❤ {formatNumber(post.likes)} · 🔖 {formatNumber(post.saves)}</p>
                </div>
                <span className={`badge ${post.type === 'reel' ? 'badge-creator' : post.type === 'video' ? 'badge-primary' : 'badge-gray'} text-[10px]`}>{post.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform breakdown */}
      <div className="card p-6">
        <h2 className="section-title">Platform Performance</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { platform: 'Instagram', followers: 312000, engagement: '4.8%', color: 'bg-gradient-instagram' },
            { platform: 'TikTok', followers: 89000, engagement: '6.2%', color: 'bg-gradient-to-br from-gray-900 to-gray-700' },
            { platform: 'YouTube', followers: 0, engagement: '—', color: 'bg-gradient-to-br from-red-500 to-red-700' },
          ].map(p => (
            <div key={p.platform} className={`${p.color} rounded-2xl p-5 text-white`}>
              <p className="font-semibold mb-3">{p.platform}</p>
              <p className="font-heading font-bold text-3xl">{formatNumber(p.followers) || '—'}</p>
              <p className="text-white/70 text-xs mt-1">followers · {p.engagement} engagement</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
