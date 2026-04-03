import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DollarSign, ShoppingBag, TrendingUp, Users, ArrowRight,
  Plus, Zap, BarChart3, MessageSquare, Clock
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { orders, earningsHistory, contentFeed, campaigns, formatCurrency, formatNumber, timeAgo } from '../../data';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';

export default function CreatorDashboard() {
  const { user } = useAuth();
  const myOrders = orders.filter(o => o.creatorId === 'c1').slice(0, 4);
  const recentContent = contentFeed.filter(p => p.creatorId === 'c1').slice(0, 3);
  const chartData = earningsHistory.slice(-6);

  return (
    <DashboardLayout>
      <SEO title="Creator Dashboard" noindex={true} />
      {/* Welcome */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your creator account</p>
        </div>
        <Link to="/creator/post/new" className="btn btn-creator btn-md">
          <Plus size={16} /> New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Wallet Balance" value={`$${user?.walletBalance?.toLocaleString() || '3,120'}`} icon={DollarSign} color="wallet" trend="up" trendValue={12} delay={0} />
        <StatCard title="Pending Earnings" value={`$${user?.pendingBalance?.toLocaleString() || '2,240'}`} icon={Clock} color="primary" delay={0.05} />
        <StatCard title="Active Orders" value={myOrders.filter(o => ['active', 'in_review', 'delivered'].includes(o.status)).length.toString()} icon={ShoppingBag} color="creator" trend="up" trendValue={8} delay={0.1} />
        <StatCard title="Total Followers" value={formatNumber(401000)} icon={Users} color="brand" trend="up" trendValue={3} delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">Earnings Overview</h2>
            <Link to="/creator/earnings" className="btn btn-ghost btn-sm text-primary">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="creatorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Earnings']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'Inter' }} />
                <Area type="monotone" dataKey="earnings" stroke="#EC4899" strokeWidth={2.5} fill="url(#creatorGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">$8,320</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">$47,200</p>
              <p className="text-xs text-gray-500">This year</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-green-600">+14%</p>
              <p className="text-xs text-gray-500">vs last month</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="section-title">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/creator/post/new', icon: Plus, label: 'Upload new content', desc: 'Photos, videos, reels', color: 'creator' },
              { to: '/creator/campaigns', icon: Zap, label: 'Browse campaigns', desc: '8 matching your profile', color: 'primary' },
              { to: '/creator/pitch', icon: MessageSquare, label: 'Pitch a brand', desc: 'Reach out directly', color: 'brand' },
              { to: '/creator/analytics', icon: BarChart3, label: 'View analytics', desc: 'Performance stats', color: 'wallet' },
              { to: '/creator/withdraw', icon: DollarSign, label: 'Withdraw funds', desc: `$${user?.walletBalance?.toLocaleString() || '3,120'} available`, color: 'success' },
            ].map((action, i) => (
              <Link key={action.to} to={action.to}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color === 'creator' ? 'bg-creator/10' : action.color === 'primary' ? 'bg-primary/10' : action.color === 'brand' ? 'bg-brand/10' : action.color === 'wallet' ? 'bg-wallet/10' : 'bg-green-100'}`}>
                    <action.icon size={16} className={action.color === 'creator' ? 'text-creator' : action.color === 'primary' ? 'text-primary' : action.color === 'brand' ? 'text-brand' : action.color === 'wallet' ? 'text-wallet' : 'text-green-600'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto text-gray-400" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Orders</h2>
            <Link to="/creator/orders" className="btn btn-ghost btn-sm text-primary">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {myOrders.length > 0 ? myOrders.map(order => (
              <Link key={order.id} to={`/creator/orders/${order.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <img src={order.brandLogo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.title}</p>
                    <p className="text-xs text-gray-500">{order.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-wallet">{formatCurrency(order.creatorEarnings)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </Link>
            )) : (
              <p className="text-center text-gray-400 py-8 text-sm">No orders yet. Start applying to campaigns!</p>
            )}
          </div>
        </div>

        {/* Recent Content */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Content</h2>
            <Link to="/creator/feed" className="btn btn-ghost btn-sm text-primary">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {recentContent.map(post => (
              <div key={post.id} className="flex items-center gap-3">
                <img src={post.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-2">{post.caption}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">❤ {formatNumber(post.likes)} · 🔖 {formatNumber(post.saves)}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/creator/post/new" className="btn btn-creator btn-sm w-full mt-4">
            <Plus size={13} /> Upload New
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
