import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  DollarSign, ShoppingBag, Users, ArrowRight, Plus,
  Zap, BarChart3, MessageSquare, Clock, TrendingUp, Image,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { supabase } from '../../supabaseClient';
import { getCreatorPosts, getRecentFollowerProfiles, getFollowerCount } from '../../lib/db';
import { formatCurrency, formatNumber, normalizeOrder } from '../../lib/normalize';

/* ── time-of-day greeting ── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── build 6-month earnings chart from transactions ── */
function buildEarningsChart(txs) {
  const map = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    map[key] = { month: d.toLocaleString('default', { month: 'short' }), earnings: 0 };
  }
  txs.forEach(tx => {
    if (tx.amount <= 0) return;
    const d = new Date(tx.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (map[key]) map[key].earnings += Number(tx.amount);
  });
  return Object.values(map);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-creator text-sm">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function CreatorDashboard() {
  const { user } = useAuth();

  const [orders,        setOrders]        = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [transactions,  setTransactions]  = useState([]);
  const [profile,       setProfile]       = useState(null);
  const [followers,     setFollowers]     = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading,       setLoading]       = useState(true);

  /* ── initial load ── */
  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      const [ordRes, txRes, profRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, brand_profiles(name, logo_url, slug)')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wallet_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('creator_profiles')
          .select('wallet_balance, pending_balance, instagram_followers, tiktok_followers, youtube_followers, name, avatar_url')
          .eq('id', user.id)
          .single(),
      ]);

      setOrders(ordRes.data || []);
      setTransactions(txRes.data || []);
      setProfile(profRes.data || null);

      // posts + followers separately (can fail silently)
      getCreatorPosts(user.id)
        .then(posts => setRecentContent(posts.slice(0, 3)))
        .catch(() => {});

      getRecentFollowerProfiles(user.id, 8)
        .then(setFollowers)
        .catch(() => {});

      getFollowerCount(user.id)
        .then(setFollowerCount)
        .catch(() => {});

      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [user?.id]);

  /* ── realtime ── */
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`creator-dash-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders', filter: `creator_id=eq.${user.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') setOrders(p => [payload.new, ...p]);
        else if (payload.eventType === 'UPDATE') setOrders(p => p.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        else if (payload.eventType === 'DELETE') setOrders(p => p.filter(o => o.id !== payload.old.id));
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}`,
      }, payload => {
        setTransactions(p => [payload.new, ...p]);
        // re-fetch live wallet balance
        supabase.from('creator_profiles').select('wallet_balance, pending_balance').eq('id', user.id).single()
          .then(({ data }) => { if (data) setProfile(prev => ({ ...prev, ...data })); });
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'follows', filter: `creator_id=eq.${user.id}`,
      }, () => {
        setFollowerCount(c => c + 1);
        getRecentFollowerProfiles(user.id, 8).then(setFollowers).catch(() => {});
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  /* ── computed ── */
  const walletBalance   = profile?.wallet_balance  ?? user?.walletBalance  ?? 0;
  const pendingBalance  = profile?.pending_balance ?? user?.pendingBalance ?? 0;
  const activeOrders    = orders.filter(o => ['active', 'in_review', 'delivered'].includes(o.status)).length;
  const totalFollowers  = (profile?.instagram_followers || 0) + (profile?.tiktok_followers || 0) + (profile?.youtube_followers || 0);
  const earningsChart   = buildEarningsChart(transactions);
  const recentOrders    = orders.slice(0, 5).map(normalizeOrder);

  const thisMonthKey    = `${new Date().getFullYear()}-${new Date().getMonth()}`;
  const thisMonthEarn   = transactions.filter(tx => {
    const d = new Date(tx.created_at);
    return tx.amount > 0 && `${d.getFullYear()}-${d.getMonth()}` === thisMonthKey;
  }).reduce((s, tx) => s + Number(tx.amount), 0);
  const totalEarnings   = transactions.filter(tx => tx.amount > 0).reduce((s, tx) => s + Number(tx.amount), 0);

  const statCards = [
    { title: 'Wallet Balance',   value: formatCurrency(walletBalance),  icon: DollarSign, color: 'from-wallet/20 to-wallet/5',     iconColor: 'text-wallet',   border: 'border-wallet/20' },
    { title: 'Pending Earnings', value: formatCurrency(pendingBalance), icon: Clock,      color: 'from-primary/20 to-primary/5',   iconColor: 'text-primary',  border: 'border-primary/20' },
    { title: 'Active Orders',    value: activeOrders,                   icon: ShoppingBag,color: 'from-creator/20 to-creator/5',   iconColor: 'text-creator',  border: 'border-creator/20' },
    { title: 'Total Followers',  value: formatNumber(followerCount),    icon: Users,      color: 'from-brand/20 to-brand/5',       iconColor: 'text-brand',    border: 'border-brand/20' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="w-10 h-10 border-4 border-creator/20 border-t-creator rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO title="Creator Dashboard" noindex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your creator account</p>
        </div>
        <Link to="/creator/post/new" className="btn btn-creator btn-md self-start sm:self-auto">
          <Plus size={16} /> New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`card p-5 border ${s.border} bg-gradient-to-br ${s.color}`}
          >
            <div className="mb-3">
              <div className="w-9 h-9 rounded-xl bg-white/60 dark:bg-gray-900/40 flex items-center justify-center">
                <s.icon size={17} className={s.iconColor} />
              </div>
            </div>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white leading-none mb-1">{s.value}</p>
            <p className="text-xs text-gray-500">{s.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Social Platforms */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Social Platforms</h2>
          <Link to="/creator/profile/edit" className="btn btn-ghost btn-sm text-creator gap-1">
            Edit <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Instagram',
              count: profile?.instagram_followers || 0,
              color: 'text-pink-500',
              bg: 'bg-pink-50 dark:bg-pink-900/10',
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              ),
            },
            {
              label: 'TikTok',
              count: profile?.tiktok_followers || 0,
              color: 'text-gray-900 dark:text-white',
              bg: 'bg-gray-50 dark:bg-gray-800',
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
              ),
            },
            {
              label: 'YouTube',
              count: profile?.youtube_followers || 0,
              color: 'text-red-500',
              bg: 'bg-red-50 dark:bg-red-900/10',
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white" />
                </svg>
              ),
            },
          ].map(p => (
            <div key={p.label} className={`rounded-2xl p-4 ${p.bg}`}>
              <div className={`mb-2 ${p.color}`}>{p.icon}</div>
              <p className="text-lg font-heading font-bold text-gray-900 dark:text-white leading-none">
                {p.count > 0 ? formatNumber(p.count) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Earnings Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <Link to="/creator/earnings" className="btn btn-ghost btn-sm text-creator gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          {earningsChart.every(d => d.earnings === 0) ? (
            <div className="h-52 flex flex-col items-center justify-center text-center">
              <TrendingUp size={28} className="text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm font-medium text-gray-500">No earnings yet</p>
              <p className="text-xs text-gray-400 mt-1">Apply to campaigns to start earning</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="creatorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="earnings" stroke="#EC4899" strokeWidth={2.5} fill="url(#creatorGrad)" dot={{ r: 3, fill: '#EC4899', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(thisMonthEarn)}</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(totalEarnings)}</p>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">{orders.filter(o => o.status === 'completed').length}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-1.5">
            {[
              { to: '/creator/post/new',  icon: Plus,         label: 'Upload Content',    desc: 'Photos, videos, reels',                color: 'creator' },
              { to: '/creator/campaigns', icon: Zap,          label: 'Browse Campaigns',  desc: 'Find brand deals',                     color: 'primary' },
              { to: '/creator/pitch',     icon: MessageSquare,label: 'Pitch a Brand',     desc: 'Reach out directly',                   color: 'brand'   },
              { to: '/creator/analytics', icon: BarChart3,    label: 'View Analytics',    desc: 'Performance stats',                    color: 'wallet'  },
              { to: '/creator/withdraw',  icon: DollarSign,   label: 'Withdraw Funds',    desc: `${formatCurrency(walletBalance)} available`, color: 'success' },
            ].map(a => (
              <Link key={a.to} to={a.to}>
                <motion.div whileHover={{ x: 3 }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    a.color === 'creator' ? 'bg-creator/10' : a.color === 'primary' ? 'bg-primary/10' :
                    a.color === 'brand' ? 'bg-brand/10' : a.color === 'wallet' ? 'bg-wallet/10' : 'bg-green-100 dark:bg-green-900/20'
                  }`}>
                    <a.icon size={15} className={
                      a.color === 'creator' ? 'text-creator' : a.color === 'primary' ? 'text-primary' :
                      a.color === 'brand' ? 'text-brand' : a.color === 'wallet' ? 'text-wallet' : 'text-green-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.label}</p>
                    <p className="text-xs text-gray-400 truncate">{a.desc}</p>
                  </div>
                  <ArrowRight size={13} className="text-gray-400 flex-shrink-0" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link to="/creator/orders" className="btn btn-ghost btn-sm text-creator gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No orders yet</p>
              <p className="text-xs text-gray-400 mt-1">Apply to campaigns to start getting orders</p>
              <Link to="/creator/campaigns" className="btn btn-creator btn-sm mt-4">Browse Campaigns</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <Link key={order.id} to={`/creator/orders/${order.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                    {order.brandLogo ? (
                      <img src={order.brandLogo} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0">
                        {order.brandName?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.title}</p>
                      <p className="text-xs text-gray-400">{order.brandName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-wallet">{formatCurrency(order.creator_earnings || order.amount)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Content */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Recent Content</h2>
            <Link to="/creator/feed" className="btn btn-ghost btn-sm text-creator gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {recentContent.length === 0 ? (
            <div className="text-center py-6">
              <Image size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContent.map(post => (
                <div key={post.id} className="flex items-center gap-3">
                  <img
                    src={post.thumbnail_url || post.media_url || `https://picsum.photos/48?random=${post.id}`}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">{post.caption || 'No caption'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ❤ {formatNumber(post.likes || 0)} · 💬 {formatNumber(post.comments || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/creator/post/new" className="btn btn-creator btn-sm w-full mt-4">
            <Plus size={13} /> Upload New
          </Link>
        </div>
      </div>

      {/* Recent Followers */}
      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Recent Followers</h2>
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-creator/10 text-creator">
              <span className="w-1.5 h-1.5 rounded-full bg-creator animate-pulse inline-block" />
              Live
            </span>
          </div>
          <p className="text-xs text-gray-400">{formatNumber(followerCount)} total</p>
        </div>

        {followers.length === 0 ? (
          <div className="text-center py-8">
            <Users size={30} className="text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">No followers yet</p>
            <p className="text-xs text-gray-400 mt-1">Share your profile to grow your audience</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {followers.map(f => (
              <motion.div
                key={f.follower_id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-1.5 text-center group"
              >
                {f.avatar ? (
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-creator/20 group-hover:ring-creator/50 transition-all"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-creator/30 to-brand/30 flex items-center justify-center text-white font-bold text-sm ring-2 ring-creator/20 group-hover:ring-creator/50 transition-all">
                    {f.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-tight line-clamp-1 w-full">{f.name}</p>
                <p className="text-[10px] text-gray-400 capitalize">{f.role}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
