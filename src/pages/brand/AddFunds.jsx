import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Shield, Zap, CreditCard, DollarSign,
  CheckCircle, Clock, Wallet, ArrowRight, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { startWalletTopUp, getWalletTransactions } from '../../lib/payments';
import { supabase } from '../../supabaseClient';
import { formatCurrency, timeAgo } from '../../lib/normalize';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

const perks = [
  { icon: Zap,         text: 'Instant activation — funds appear in seconds after payment' },
  { icon: Shield,      text: 'Escrow protected — brands never pay creators before delivery' },
  { icon: CreditCard,  text: 'Pay with any card — Visa, Mastercard, Amex, or local cards' },
  { icon: CheckCircle, text: 'Unused balance never expires and is fully refundable' },
];

export default function BrandAddFunds() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [customActive, setCustomActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      supabase.from('brand_profiles').select('wallet_balance').eq('id', user.id).single(),
      getWalletTransactions(user.id, 10),
    ]).then(([{ data: profile }, txs]) => {
      if (profile) setWalletBalance(profile.wallet_balance || 0);
      setTransactions(txs);
    }).catch(() => {}).finally(() => setTxLoading(false));
  }, [user?.id]);

  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount >= 10;
  const stripeFee = parsedAmount > 0 ? (parsedAmount * 0.029 + 0.30).toFixed(2) : '0.00';
  const total = parsedAmount > 0 ? (parsedAmount + parseFloat(stripeFee)).toFixed(2) : '0.00';

  const selectPreset = (val) => {
    setAmount(val.toString());
    setCustomActive(false);
  };

  const handleTopUp = async () => {
    if (!isValid) { toast.error('Minimum top-up is $10'); return; }
    if (!user?.id || !user?.email) { toast.error('Please log in first'); return; }
    setLoading(true);
    try {
      await startWalletTopUp({ userId: user.id, userEmail: user.email, amount: parsedAmount });
      // Redirects — loading stays true
    } catch (err) {
      toast.error(err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <SEO title="Add Funds" noindex={true} />

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><Plus size={22} className="text-brand" />Add Funds</h1>
          <p className="page-subtitle">Top up your wallet to pay creators and run campaigns</p>
        </div>
        <Link to="/brand/payments" className="btn btn-outline btn-md">View Payments</Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left — form */}
        <div className="lg:col-span-3 space-y-5">

          {/* Current balance */}
          <div className="rounded-2xl bg-gradient-to-br from-brand to-teal-600 text-white p-6 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1 flex items-center gap-1.5"><Wallet size={14} /> Current Wallet Balance</p>
              <p className="font-heading font-extrabold text-4xl">{formatCurrency(walletBalance)}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <DollarSign size={32} className="text-white/80" />
            </div>
          </div>

          {/* Preset amounts */}
          <div className="card p-6">
            <label className="label mb-4">Select amount to add</label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {PRESET_AMOUNTS.map(val => (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectPreset(val)}
                  className={`h-14 rounded-2xl border-2 font-heading font-bold text-lg transition-all
                    ${amount === val.toString() && !customActive
                      ? 'border-brand bg-brand/10 text-brand dark:bg-brand/20'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand/50'
                    }`}
                >
                  ${val}
                </motion.button>
              ))}
            </div>

            {/* Custom amount */}
            <div
              onClick={() => setCustomActive(true)}
              className={`flex items-center gap-3 border-2 rounded-2xl p-4 cursor-text transition-all
                ${customActive ? 'border-brand bg-brand/5 dark:bg-brand/10' : 'border-gray-200 dark:border-gray-700 hover:border-brand/50'}`}
            >
              <span className="text-xl font-heading font-bold text-gray-400">$</span>
              <input
                type="number"
                min={10}
                step={1}
                placeholder="Custom amount"
                value={customActive ? amount : ''}
                onChange={e => { setAmount(e.target.value); setCustomActive(true); }}
                onFocus={() => setCustomActive(true)}
                className="flex-1 bg-transparent outline-none text-lg font-heading font-bold text-gray-900 dark:text-white placeholder-gray-400"
              />
              {customActive && amount && (
                <span className="text-xs text-gray-400">min $10</span>
              )}
            </div>

            {/* Fee breakdown */}
            <AnimatePresence>
              {parsedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Wallet credit</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(parsedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <CreditCard size={12} /> Stripe processing fee
                        <span className="text-[10px] text-gray-400">(2.9% + $0.30)</span>
                      </span>
                      <span className="text-gray-500">${stripeFee}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="text-gray-900 dark:text-white">Total charged to card</span>
                      <span className="text-brand">${total}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 pt-1">
                      <strong className="text-gray-600 dark:text-gray-300">{formatCurrency(parsedAmount)}</strong> will be added to your OgisBack wallet immediately after payment.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={handleTopUp}
            disabled={!isValid || loading}
            className="w-full h-16 rounded-2xl text-white font-heading font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
            style={{ background: isValid ? 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' : undefined, backgroundColor: isValid ? undefined : '#D1D5DB' }}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Redirecting to Stripe…</>
            ) : (
              <><Plus size={20} /> Add {isValid ? formatCurrency(parsedAmount) : '$0'} to Wallet <ArrowRight size={18} /></>
            )}
          </motion.button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield size={12} />
            Secured by Stripe · PCI DSS compliant · 256-bit SSL
          </div>
        </div>

        {/* Right — info + history */}
        <div className="lg:col-span-2 space-y-5">

          {/* Why add funds */}
          <div className="card p-6">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Why add wallet funds?</h3>
            <div className="space-y-3">
              {perks.map((p, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <p.icon size={15} className="text-brand" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">How it works</h3>
            <div className="space-y-3">
              {[
                { step: '1', label: 'Add funds', desc: 'Pay securely via Stripe' },
                { step: '2', label: 'Hire a creator', desc: 'Funds move to escrow instantly' },
                { step: '3', label: 'Approve content', desc: 'Creator gets paid, you keep control' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand/10 text-brand text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.label}</p>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent top-ups */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={14} className="text-gray-400" /> Recent Top-ups
            </h3>
            {txLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
            ) : transactions.filter(t => t.type === 'topup').length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No top-ups yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.filter(t => t.type === 'topup').slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{tx.description}</p>
                      <p className="text-xs text-gray-400">{timeAgo(tx.created_at)}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">+{formatCurrency(tx.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
