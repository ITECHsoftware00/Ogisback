import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Search, Megaphone, ShoppingBag, DollarSign, Users,
  ArrowRight, Plus, TrendingUp, TrendingDown, Zap,
  CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { supabase } from '../../supabaseClient';
import { formatCurrency, formatNumber, normalizeOrder } from '../../lib/normalize';

/* ── helpers ── */
function monthLabel(d) {
  return new Date(d).toLocaleString('default', { month: 'short' });
}

function buildSpendChart(orders) {
  const map = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    map[key] = { month: monthLabel(d), spend: 0 };
  }
  orders.forEach(o => {
    if (!['completed', 'paid'].includes(o.status)) return;
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (map[key]) map[key].spend += Number(o.amount || 0);
  });
  return Object.values(map);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 shadow-lg text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-brand text-sm">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function BrandDashboard() {
  const { user } = useAuth();

  const [orders,     setOrders]     = useState([]);
  const [campaigns,  setCampaigns]  = useState([]);
  const [creators,   setCreators]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const ordersRef = useRef([]);
  ordersRef.current = orders;

  /* ── initial load ── */
  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      const [ordRes, camRes, crRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, creator_profiles(name, username, avatar_url), brand_profiles(name, logo_url)')
          .eq('brand_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('campaigns')
          .select('id, title, status, budget_min, budget_max, created_at')
          .eq('brand_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('creator_profiles')
          .select('id, name, username, avatar_url, rating, instagram_followers, tiktok_followers, niche')
          .order('rating', { ascending: false })
          .limit(4),
      ]);

      setOrders(ordRes.data || []);
      setCampaigns(camRes.data || []);
      setCreators(crRes.data || []);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [user?.id]);

  /* ── realtime ── */
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`brand-dash-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders', filter: `brand_id=eq.${user.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'campaigns', filter: `brand_id=eq.${user.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setCampaigns(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setCampaigns(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
        } else if (payload.eventType === 'DELETE') {
          setCampaigns(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  /* ── computed stats ── */
  const totalSpent      = orders.filter(o => ['completed', 'paid'].includes(o.status)).reduce((s, o) => s + Number(o.amount || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const activeOrders    = orders.filter(o => ['active', 'in_review', 'delivered'].includes(o.status)).length;
  const creatorsHired   = new Set(orders.map(o => o.creator_id)).size;
  const spendChart      = buildSpendChart(orders);
  const recentOrders    = orders.slice(0, 5).map(normalizeOrder);

  const statCards = [
    { title: 'Total Spent', value: formatCurrency(totalSpent), icon: DollarSign, color: 'from-brand/20 to-brand/5', iconColor: 'text-brand', border: 'border-brand/20' },
    { title: 'Active Campaigns', value: activeCampaigns, icon: Megaphone, color: 'from-primary/20 to-primary/5', iconColor: 'text-primary', border: 'border-primary/20' },
    { title: 'Active Orders', value: activeOrders, icon: ShoppingBag, color: 'from-creator/20 to-creator/5', iconColor: 'text-creator', border: 'border-creator/20' },
    { title: 'Creators Hired', value: creatorsHired, icon: Users, color: 'from-wallet/20 to-wallet/5', iconColor: 'text-wallet', border: 'border-wallet/20' },
  ];

  const statusIcon = { completed: CheckCircle, active: Clock, in_review: AlertCircle, delivered: TrendingUp };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO title="Brand Dashboard" noindex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your campaigns today</p>
        </div>
        <Link to="/brand/campaigns/new" className="btn btn-brand btn-md self-start sm:self-auto">
          <Plus size={16} /> New Campaign
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
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-white/60 dark:bg-gray-900/40 flex items-center justify-center`}>
                <s.icon size={17} className={s.iconColor} />
              </div>
            </div>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white leading-none mb-1">{s.value}</p>
            <p className="text-xs text-gray-500">{s.title}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spend chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Campaign Spend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <Link to="/brand/payments" className="btn btn-ghost btn-sm text-brand gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {spendChart.every(d => d.spend === 0) ? (
            <div className="h-52 flex flex-col items-center justify-center text-center">
              <Zap size={28} className="text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm font-medium text-gray-500">No spend data yet</p>
              <p className="text-xs text-gray-400 mt-1">Complete an order to see your spend chart</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="spend" stroke="#0D9488" strokeWidth={2.5} fill="url(#brandGrad)" dot={{ r: 3, fill: '#0D9488', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-1.5">
            {[
              { to: '/brand/discover',      icon: Search,    label: 'Discover Creators', desc: '6,000+ verified creators', color: 'brand' },
              { to: '/brand/campaigns/new', icon: Megaphone, label: 'Create Campaign',    desc: 'Post a new brief',          color: 'primary' },
              { to: '/brand/orders',        icon: ShoppingBag, label: 'Review Orders',    desc: 'Check pending deliveries', color: 'creator' },
              { to: '/brand/saved',         icon: Users,     label: 'Saved Creators',     desc: 'Your shortlist',            color: 'wallet' },
            ].map(a => (
              <Link key={a.to} to={a.to}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    a.color === 'brand' ? 'bg-brand/10' : a.color === 'primary' ? 'bg-primary/10' :
                    a.color === 'creator' ? 'bg-creator/10' : 'bg-wallet/10'
                  }`}>
                    <a.icon size={15} className={
                      a.color === 'brand' ? 'text-brand' : a.color === 'primary' ? 'text-primary' :
                      a.color === 'creator' ? 'text-creator' : 'text-wallet'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                  <ArrowRight size={13} className="text-gray-400 flex-shrink-0" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link to="/brand/orders" className="btn btn-ghost btn-sm text-brand gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag size={32} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No orders yet</p>
              <p className="text-xs text-gray-400 mt-1">Hire a creator to get started</p>
              <Link to="/brand/discover" className="btn btn-brand btn-sm mt-4">Discover Creators</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <Link key={order.id} to={`/brand/orders/${order.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                    <img
                      src={order.creatorAvatar || `https://i.pravatar.cc/40?u=${order.id}`}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.title}</p>
                      <p className="text-xs text-gray-400">{order.creatorName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top creators */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-gray-900 dark:text-white">Top Creators</h2>
            <Link to="/brand/discover" className="btn btn-ghost btn-sm text-brand gap-1">
              See all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="space-y-2">
            {creators.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No creators found</p>
            ) : creators.map(c => (
              <Link key={c.id} to={`/brand/discover/${c.username}`}>
                <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-creator flex items-center justify-center text-white font-bold flex-shrink-0">
                      {c.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {c.niche?.[0]} · {formatNumber((c.instagram_followers || 0) + (c.tiktok_followers || 0))}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-wallet">⭐ {c.rating?.toFixed(1) || '—'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
