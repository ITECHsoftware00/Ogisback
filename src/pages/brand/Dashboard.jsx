import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Megaphone, ShoppingBag, DollarSign, Users, ArrowRight, Plus, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { orders, campaigns, creators, formatCurrency, formatNumber } from '../../data';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';

const spendData = [
  { month: 'Feb', spend: 8000 }, { month: 'Mar', spend: 12000 },
  { month: 'Apr', spend: 9500 }, { month: 'May', spend: 16000 },
  { month: 'Jun', spend: 14500 }, { month: 'Jul', spend: 18000 },
];

export default function BrandDashboard() {
  const { user } = useAuth();
  const myOrders = orders.filter(o => o.brandId === 'b1').slice(0, 4);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').slice(0, 3);

  return (
    <DashboardLayout>
      <SEO title="Brand Dashboard" noindex={true} />
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Welcome back, {user?.name} 👋</h1>
          <p className="page-subtitle">Brand campaign overview for today</p>
        </div>
        <Link to="/brand/campaigns/new" className="btn btn-brand btn-md">
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Spent" value="$48,000" icon={DollarSign} color="brand" trend="up" trendValue={24} />
        <StatCard title="Active Campaigns" value="3" icon={Megaphone} color="primary" delay={0.05} />
        <StatCard title="Active Orders" value={myOrders.filter(o => ['active', 'in_review', 'delivered'].includes(o.status)).length.toString()} icon={ShoppingBag} color="creator" delay={0.1} />
        <StatCard title="Creators Hired" value="47" icon={Users} color="brand" trend="up" trendValue={8} delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spend chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">Campaign Spend</h2>
            <Link to="/brand/payments" className="btn btn-ghost btn-sm text-brand">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendData} barSize={28}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Spend']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '13px' }} />
                <Bar dataKey="spend" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="section-title">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/brand/discover', icon: Search, label: 'Discover creators', desc: '6,000+ verified creators', color: 'brand' },
              { to: '/brand/campaigns/new', icon: Megaphone, label: 'Create campaign', desc: 'Post a new brief', color: 'primary' },
              { to: '/brand/orders', icon: ShoppingBag, label: 'Review orders', desc: 'Check pending deliveries', color: 'creator' },
              { to: '/brand/saved', icon: Users, label: 'Saved creators', desc: 'Your shortlist', color: 'wallet' },
            ].map(action => (
              <Link key={action.to} to={action.to}>
                <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color === 'brand' ? 'bg-brand/10' : action.color === 'primary' ? 'bg-primary/10' : action.color === 'creator' ? 'bg-creator/10' : 'bg-wallet/10'}`}>
                    <action.icon size={16} className={action.color === 'brand' ? 'text-brand' : action.color === 'primary' ? 'text-primary' : action.color === 'creator' ? 'text-creator' : 'text-wallet'} />
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

        {/* Recent orders */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Orders</h2>
            <Link to="/brand/orders" className="btn btn-ghost btn-sm text-brand">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {myOrders.map(order => (
              <Link key={order.id} to={`/brand/orders/${order.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <img src={order.creatorAvatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.title}</p>
                    <p className="text-xs text-gray-500">{order.creator}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top creators */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Top Creators</h2>
            <Link to="/brand/discover" className="btn btn-ghost btn-sm text-brand">See all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {creators.slice(0, 4).map(c => (
              <Link key={c.id} to={`/brand/discover/${c.username}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-xl transition-all">
                <img src={c.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.niche[0]} · {formatNumber(c.totalFollowers)}</p>
                </div>
                <span className="text-xs font-semibold text-wallet">⭐ {c.rating}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
