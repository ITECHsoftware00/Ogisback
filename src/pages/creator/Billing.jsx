import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Receipt, Download, Calendar, ArrowRight,
  CheckCircle, Clock, AlertCircle, FileText, DollarSign,
  TrendingUp, ArrowUpRight, ArrowDownLeft, Filter, Search,
  Crown, Zap, ExternalLink, Loader2,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SubscriptionBilling from '../../components/SubscriptionBilling';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getWalletTransactions, getSubscription, openCustomerPortal } from '../../lib/payments';
import { getWithdrawals } from '../../lib/db';
import { formatCurrency, timeAgo } from '../../lib/normalize';

const TYPE_META = {
  order_payment:   { label: 'Order Payment',     icon: ArrowUpRight,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  order_earning:   { label: 'Order Earning',     icon: ArrowDownLeft, color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  escrow_credit:   { label: 'Escrow Credit',     icon: DollarSign,    color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  escrow_release:  { label: 'Escrow Release',    icon: CheckCircle,   color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  withdrawal:      { label: 'Withdrawal',        icon: ArrowUpRight,  color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  subscription:    { label: 'Subscription',      icon: Crown,         color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  topup:           { label: 'Top-up',            icon: ArrowDownLeft, color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  refund:          { label: 'Refund',            icon: ArrowDownLeft, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
};

const STATUS_BADGE = {
  completed: { label: 'Completed', color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
  pending:   { label: 'Pending',   color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
  failed:    { label: 'Failed',    color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateFull(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CreatorBilling() {
  const { user, plan } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals]   = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [selectedTx, setSelectedTx]     = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      getWalletTransactions(user.id, 100),
      getWithdrawals(user.id),
      getSubscription(user.id),
    ]).then(([txs, wds, sub]) => {
      setTransactions(txs);
      setWithdrawals(wds);
      setSubscription(sub);
    }).catch(err => console.error('[Billing] load error:', err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Merge transactions + withdrawals into a unified invoice list
  const allInvoices = [
    ...transactions.map(t => ({
      id:          t.id,
      type:        t.type,
      amount:      t.amount,
      description: t.description,
      status:      t.status || 'completed',
      date:        t.created_at,
      orderId:     t.order_id,
    })),
    ...withdrawals.map(w => ({
      id:          w.id,
      type:        'withdrawal',
      amount:      -w.amount,
      description: `Withdrawal via ${w.method}`,
      status:      w.status,
      date:        w.created_at,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filter
  const filteredInvoices = allInvoices.filter(inv => {
    if (filter !== 'all' && inv.type !== filter) return false;
    if (search && !inv.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const totalEarned = transactions
    .filter(t => t.amount > 0 && (t.type === 'order_earning' || t.type === 'escrow_release'))
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((s, w) => s + w.amount, 0);
  const totalFees = transactions
    .filter(t => t.type === 'subscription')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal(user.id);
    } catch {
      // Portal handles redirect
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading billing data…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO title="Billing & Invoices" noindex={true} />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <CreditCard size={22} className="text-primary" />Billing & Invoices
            </h1>
            <p className="page-subtitle mt-1">Manage your subscription, view payment history, and download invoices</p>
          </div>
          {plan !== 'free' && (
            <button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="btn btn-outline btn-sm flex-shrink-0 gap-1.5"
            >
              {portalLoading
                ? <><Loader2 size={13} className="animate-spin" />Opening…</>
                : <><ExternalLink size={13} />Stripe Portal</>}
            </button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp size={18} className="text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{formatCurrency(totalEarned)}</p>
            <p className="text-xs text-gray-400 mt-1">Total Earned</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <ArrowUpRight size={18} className="text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{formatCurrency(totalWithdrawn)}</p>
            <p className="text-xs text-gray-400 mt-1">Total Withdrawn</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Crown size={18} className="text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{formatCurrency(totalFees)}</p>
            <p className="text-xs text-gray-400 mt-1">Subscription Fees</p>
          </motion.div>
        </div>

        {/* Subscription Plan Card */}
        <div className="mb-6">
          <SubscriptionBilling role="creator" />
        </div>

        {/* Invoice History */}
        <div className="card overflow-hidden">
          {/* Invoice Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt size={16} className="text-primary" />Invoice History
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">
                {filteredInvoices.length} transactions
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search invoices…"
                  className="input pl-8 text-sm py-2"
                />
              </div>
              {/* Filter */}
              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'order_earning', label: 'Earnings' },
                  { key: 'withdrawal', label: 'Withdrawals' },
                  { key: 'subscription', label: 'Subscriptions' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      filter === f.key
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invoice List */}
          {filteredInvoices.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filteredInvoices.map((inv, i) => {
                const meta = TYPE_META[inv.type] || TYPE_META.order_payment;
                const Icon = meta.icon;
                const statusInfo = STATUS_BADGE[inv.status] || STATUS_BADGE.completed;
                const isPositive = inv.amount > 0;

                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => setSelectedTx(selectedTx?.id === inv.id ? null : inv)}
                    className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={meta.color} />
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {inv.description || meta.label}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar size={10} />{formatDate(inv.date)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {meta.label}
                        </span>
                        {inv.orderId && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            #{inv.orderId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${isPositive ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(Math.abs(inv.amount))}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {timeAgo(inv.date)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">No transactions found</p>
              <p className="text-xs text-gray-400">
                {filter !== 'all' || search
                  ? 'Try changing your filters or search term.'
                  : 'Your payment history will appear here once you complete a deal or subscribe.'}
              </p>
            </div>
          )}
        </div>

        {/* Transaction Detail Drawer */}
        <AnimatePresence>
          {selectedTx && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTx(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
              >
                {(() => {
                  const meta = TYPE_META[selectedTx.type] || TYPE_META.order_payment;
                  const Icon = meta.icon;
                  const statusInfo = STATUS_BADGE[selectedTx.status] || STATUS_BADGE.completed;
                  const isPositive = selectedTx.amount > 0;

                  return (
                    <>
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center`}>
                          <Icon size={20} className={meta.color} />
                        </div>
                        <div>
                          <p className="font-heading font-bold text-gray-900 dark:text-white">{meta.label}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Amount</span>
                          <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                            {isPositive ? '+' : ''}{formatCurrency(Math.abs(selectedTx.amount))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Date</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{formatDateFull(selectedTx.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Description</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 text-right max-w-[200px]">{selectedTx.description}</span>
                        </div>
                        {selectedTx.orderId && (
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Order</span>
                            <Link
                              to={`/creator/orders/${selectedTx.orderId}`}
                              className="text-sm text-primary font-medium hover:underline"
                            >
                              #{selectedTx.orderId.slice(0, 8)}
                            </Link>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Transaction ID</span>
                          <span className="text-[11px] text-gray-500 font-mono">{selectedTx.id.slice(0, 12)}…</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedTx(null)}
                        className="btn btn-outline btn-md w-full"
                      >
                        Close
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stripe note */}
        <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl">
          <AlertCircle size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>Download invoices & receipts</strong> from the Stripe Customer Portal. Click "Stripe Portal" above to access your full payment history, download PDF receipts, and update your payment method — all secured by Stripe.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
