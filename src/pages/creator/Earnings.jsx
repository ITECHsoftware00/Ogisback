import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Wallet, ArrowDownToLine, TrendingUp, Clock, CheckCircle, DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { transactions, earningsHistory, formatCurrency, timeAgo } from '../../data';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';

export default function CreatorEarnings() {
  const { user } = useAuth();
  const totalEarned = earningsHistory.reduce((s, m) => s + m.earnings, 0);
  const thisMonth = earningsHistory[earningsHistory.length - 1].earnings;
  const lastMonth = earningsHistory[earningsHistory.length - 2].earnings;
  const growth = (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <SEO title="Earnings" noindex={true} />
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><Wallet size={22} className="text-wallet" />Earnings</h1>
          <p className="page-subtitle">Track your income and payment history</p>
        </div>
        <Link to="/creator/withdraw" className="btn btn-md bg-gradient-gold text-white hover:opacity-90">
          <ArrowDownToLine size={16} /> Withdraw Funds
        </Link>
      </div>

      {/* Wallet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 bg-gradient-to-br from-wallet to-orange-400 text-white">
          <p className="text-white/80 text-sm mb-1">Available Balance</p>
          <p className="font-heading font-extrabold text-4xl mb-1">${user?.walletBalance?.toLocaleString() || '3,120'}</p>
          <p className="text-white/70 text-xs">Ready to withdraw</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-primary" />
            <p className="text-sm text-gray-500">Pending (Escrow)</p>
          </div>
          <p className="font-heading font-bold text-3xl text-gray-900 dark:text-white">${user?.pendingBalance?.toLocaleString() || '2,240'}</p>
          <p className="text-xs text-gray-400 mt-1">Releases upon brand approval</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-green-500" />
            <p className="text-sm text-gray-500">Total Earned</p>
          </div>
          <p className="font-heading font-bold text-3xl text-gray-900 dark:text-white">{formatCurrency(totalEarned)}</p>
          <p className="text-xs text-green-600 mt-1">+{growth}% vs last month</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Earnings chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="section-title">Monthly Earnings</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsHistory} barSize={24}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Earnings']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: '13px' }} />
                <Bar dataKey="earnings" fill="#EC4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats */}
        <div className="card p-6">
          <h2 className="section-title">This Month</h2>
          <div className="space-y-4">
            {[
              { label: 'Gross earnings', value: formatCurrency(thisMonth + Math.round(thisMonth * 0.25)), color: 'text-gray-900 dark:text-white' },
              { label: 'Platform fee (20%)', value: `-${formatCurrency(Math.round(thisMonth * 0.25))}`, color: 'text-red-500' },
              { label: 'Net earnings', value: formatCurrency(thisMonth), color: 'text-wallet font-bold' },
              { label: 'Completed orders', value: '13', color: 'text-gray-900 dark:text-white' },
              { label: 'Avg. order value', value: formatCurrency(Math.round(thisMonth / 13)), color: 'text-gray-900 dark:text-white' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-500">{s.label}</span>
                <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <Link to="/creator/withdraw" className="btn btn-md w-full mt-4" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: 'white' }}>
            <ArrowDownToLine size={15} /> Withdraw ${user?.walletBalance?.toLocaleString() || '3,120'}
          </Link>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card p-6">
        <h2 className="section-title">Transaction History</h2>
        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : tx.type === 'debit' ? 'bg-red-100 text-red-600' : 'bg-wallet/10 text-wallet'}`}>
                {tx.type === 'credit' ? <CheckCircle size={18} /> : tx.type === 'debit' ? <ArrowDownToLine size={18} /> : <Clock size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{tx.description}</p>
                <p className="text-xs text-gray-400">{timeAgo(tx.date)}</p>
              </div>
              <div className="text-right">
                <p className={`font-heading font-bold text-sm ${tx.type === 'credit' ? 'text-green-600' : tx.type === 'debit' ? 'text-red-500' : 'text-wallet'}`}>
                  {tx.type === 'credit' ? '+' : ''}{tx.type === 'pending' ? 'Pending' : formatCurrency(Math.abs(tx.amount))}
                </p>
                <span className={`badge text-[10px] ${tx.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{tx.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
