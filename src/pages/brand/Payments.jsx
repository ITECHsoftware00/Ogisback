import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, Shield, TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { orders, formatCurrency } from '../../data';
import SEO from '../../components/SEO';

const monthlySpend = [
  { month: 'Feb', spend: 8000 }, { month: 'Mar', spend: 12000 },
  { month: 'Apr', spend: 9500 }, { month: 'May', spend: 16000 },
  { month: 'Jun', spend: 14500 }, { month: 'Jul', spend: 18000 },
];

export default function BrandPayments() {
  const brandOrders = orders.filter(o => o.brandId === 'b1');
  const totalSpent = brandOrders.reduce((s, o) => s + (o.paymentStatus === 'released' ? o.amount : 0), 0);
  const inEscrow = brandOrders.filter(o => o.paymentStatus === 'in_escrow').reduce((s, o) => s + o.amount, 0);

  return (
    <DashboardLayout>
      <SEO title="Payments" noindex={true} />
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><CreditCard size={22} className="text-brand" />Payments</h1>
        <p className="page-subtitle">Track your campaign spending and escrow balances</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 bg-gradient-brand text-white">
          <p className="text-white/80 text-sm mb-1">Total Spent (All Time)</p>
          <p className="font-heading font-extrabold text-3xl">$48,000</p>
          <p className="text-white/60 text-xs mt-1">across {brandOrders.length} orders</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-wallet" /><p className="text-sm text-gray-500">In Escrow</p></div>
          <p className="font-heading font-bold text-2xl text-gray-900 dark:text-white">{formatCurrency(inEscrow)}</p>
          <p className="text-xs text-gray-400 mt-1">Held until content approved</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-500" /><p className="text-sm text-gray-500">This Month</p></div>
          <p className="font-heading font-bold text-2xl text-gray-900 dark:text-white">$18,000</p>
          <p className="text-xs text-green-600 mt-1">+24% vs last month</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Chart */}
        <div className="card p-6">
          <h2 className="section-title">Monthly Spend</h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpend} barSize={28}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Spend']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '13px' }} />
                <Bar dataKey="spend" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Escrow explanation */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2"><Shield size={18} className="text-wallet" />How Escrow Works</h2>
          <div className="space-y-4">
            {[
              { step: '1', label: 'You pay upfront', desc: 'Full campaign amount held securely', icon: DollarSign },
              { step: '2', label: 'Creator delivers', desc: 'Content submitted for your review', icon: CheckCircle },
              { step: '3', label: 'You approve', desc: '80% released to creator, 20% platform fee', icon: Shield },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction table */}
      <div className="card p-6">
        <h2 className="section-title">Payment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Order', 'Creator', 'Amount', 'Platform Fee', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brandOrders.map(order => (
                <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-white max-w-[150px] truncate">{order.title}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <img src={order.creatorAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-gray-700 dark:text-gray-300">{order.creator}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-semibold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</td>
                  <td className="py-3 px-2 text-red-500">{formatCurrency(order.commission)}</td>
                  <td className="py-3 px-2">
                    <span className={`badge ${order.paymentStatus === 'released' ? 'badge-success' : 'badge-wallet'}`}>
                      {order.paymentStatus === 'released' ? 'Released' : 'In Escrow'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-400 text-xs">{new Date(order.createdDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
