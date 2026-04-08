import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, ShoppingBag, DollarSign, Shield, ArrowDownToLine, TrendingUp } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminStats, getRevenueChart } from '../../lib/admin';
import { formatCurrency, formatNumber } from '../../lib/normalize';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getRevenueChart()])
      .then(([s, c]) => { setStats(s); setChart(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Creators', value: formatNumber(stats.totalCreators), icon: Users, color: 'text-creator', bg: 'bg-creator/10' },
    { label: 'Total Brands', value: formatNumber(stats.totalBrands), icon: Users, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Total Orders', value: formatNumber(stats.totalOrders), icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Orders', value: formatNumber(stats.activeOrders), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Platform Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-wallet', bg: 'bg-wallet/10' },
    { label: 'Funds in Escrow', value: formatCurrency(stats.escrowHeld), icon: Shield, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Pending Withdrawals', value: formatNumber(stats.pendingWithdrawals), icon: ArrowDownToLine, color: 'text-red-400', bg: 'bg-red-400/10' },
  ] : [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-white">Platform Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time metrics across the entire platform</p>
      </div>

      {loading ? (
        <div className="text-center py-24 text-gray-500">Loading stats...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#111118] border border-gray-800 rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                  <c.icon size={18} className={c.color} />
                </div>
                <p className="text-2xl font-heading font-bold text-white">{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-[#111118] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-6">Monthly Revenue (Platform Fees)</h2>
            {chart.length > 0 ? (
              <div className="h-56" style={{ minHeight: '224px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} barSize={24}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', background: '#1F2937', color: '#F9FAFB', fontSize: '13px' }} />
                    <Bar dataKey="revenue" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-600 text-sm">No revenue data yet</div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
