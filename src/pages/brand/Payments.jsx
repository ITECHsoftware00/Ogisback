import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, Shield, TrendingUp, DollarSign, CheckCircle, Clock, Plus, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../lib/db';
import { getWalletTransactions, getBrandPaymentSummary } from '../../lib/payments';
import { formatCurrency, normalizeOrder, timeAgo } from '../../lib/normalize';

const monthlySpend = [
  { month: 'Feb', spend: 8000 }, { month: 'Mar', spend: 12000 },
  { month: 'Apr', spend: 9500 }, { month: 'May', spend: 16000 },
  { month: 'Jun', spend: 14500 }, { month: 'Jul', spend: 18000 },
];

export default function BrandPayments() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total: 0, inEscrow: 0, orderCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getOrders(user.id, 'brand'),
      getWalletTransactions(user.id, 50),
      getBrandPaymentSummary(user.id),
    ]).then(([rawOrders, txs, sum]) => {
      setOrders(rawOrders.map(normalizeOrder));
      setTransactions(txs);
      setSummary(sum);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <DashboardLayout>
      <SEO title="Payments" noindex={true} />
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><CreditCard size={22} className="text-brand" />Payments</h1>
          <p className="page-subtitle">Track your campaign spending and escrow balances</p>
        </div>
        <Link to="/brand/add-funds" className="btn btn-brand btn-md">
          <Plus size={16} /> Add Funds
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 bg-gradient-brand text-white">
          <p className="text-white/80 text-sm mb-1">Total Spent (All Time)</p>
          <p className="font-heading font-extrabold text-3xl">{formatCurrency(summary.total)}</p>
          <p className="text-white/60 text-xs mt-1">across {summary.orderCount} orders</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-wallet" /><p className="text-sm text-gray-500">In Escrow</p></div>
          <p className="font-heading font-bold text-2xl text-gray-900 dark:text-white">{formatCurrency(summary.inEscrow)}</p>
          <p className="text-xs text-gray-400 mt-1">Held until content approved</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-500" /><p className="text-sm text-gray-500">Active Orders</p></div>
          <p className="font-heading font-bold text-2xl text-gray-900 dark:text-white">{orders.filter(o => ['active','in_review','delivered'].includes(o.status)).length}</p>
          <p className="text-xs text-gray-400 mt-1">In progress right now</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6 border-2 border-brand/20">
          <div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-brand" /><p className="text-sm text-gray-500">Wallet Balance</p></div>
          <p className="font-heading font-bold text-2xl text-gray-900 dark:text-white">{formatCurrency(summary.walletBalance || 0)}</p>
          <Link to="/brand/add-funds" className="text-xs text-brand font-semibold mt-1 inline-flex items-center gap-1 hover:underline">
            <Plus size={11} /> Add funds
          </Link>
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
              { step: '1', label: 'You pay upfront', desc: 'Full campaign amount held securely in escrow', icon: DollarSign },
              { step: '2', label: 'Creator delivers', desc: 'Content submitted for your review and approval', icon: CheckCircle },
              { step: '3', label: 'You approve', desc: 'Creator receives their share, platform fee deducted', icon: Shield },
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

      {/* Order payment history */}
      <div className="card p-6 mb-6">
        <h2 className="section-title">Order History</h2>
        {loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No orders yet. Create a campaign to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Order', 'Creator', 'Amount', 'Platform Fee', 'Escrow', 'Date'].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white max-w-[150px] truncate">{order.title}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <img src={order.creatorAvatar || `https://i.pravatar.cc/24?u=${order.id}`} alt="" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-gray-700 dark:text-gray-300">{order.creatorName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-semibold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</td>
                    <td className="py-3 px-2 text-red-500">{formatCurrency(order.platform_fee || order.amount * 0.2)}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${order.escrow_status === 'released' ? 'badge-success' : order.escrow_status === 'refunded' ? 'badge-gray' : 'badge-wallet'}`}>
                        {order.escrow_status === 'released' ? 'Released' : order.escrow_status === 'refunded' ? 'Refunded' : 'In Escrow'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{timeAgo(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Wallet transactions */}
      {transactions.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title">Wallet Activity</h2>
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-500'}`}>
                  {tx.amount > 0 ? <CheckCircle size={16} /> : <DollarSign size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">{timeAgo(tx.created_at)}</p>
                </div>
                <p className={`font-heading font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
