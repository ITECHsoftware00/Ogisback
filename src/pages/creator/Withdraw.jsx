import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, Shield, CheckCircle, Clock, XCircle, ChevronRight, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { submitWithdrawal, getWithdrawalHistory } from '../../lib/payments';
import { supabase } from '../../supabaseClient';
import { formatCurrency, timeAgo } from '../../lib/normalize';

/* ─── Branded SVG icons ─────────────────────────────────────── */
const PayPalIcon = () => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <rect width="38" height="38" rx="10" fill="#003087"/>
    <path d="M25.5 11.5C25.5 15.5 22.5 17.5 18.5 17.5H16L14.5 26H10.5L14 11H20C23.5 11 25.5 11.5 25.5 11.5Z" fill="#009cde"/>
    <path d="M27 14C27 18 24 20 20 20H17.5L16 28H12L15.5 13H21.5C24.5 13 27 13.5 27 14Z" fill="white" fillOpacity="0.25"/>
    <path d="M16 17.5H18.5C22.5 17.5 25.5 15.5 25.5 11.5C24.5 11.2 23 11 21 11H15L11 26H15L16 17.5Z" fill="#012169"/>
    <text x="10" y="25" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial">PP</text>
  </svg>
);

const BankIcon = () => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <rect width="38" height="38" rx="10" fill="#1E3A5F"/>
    <rect x="8" y="27" width="22" height="2.5" rx="1.25" fill="#7EB8F7"/>
    <rect x="10" y="17" width="3" height="10" rx="1" fill="#7EB8F7"/>
    <rect x="15" y="17" width="3" height="10" rx="1" fill="#7EB8F7"/>
    <rect x="20" y="17" width="3" height="10" rx="1" fill="#7EB8F7"/>
    <rect x="25" y="17" width="3" height="10" rx="1" fill="#7EB8F7"/>
    <polygon points="19,8 30,16 8,16" fill="#5BA3E8"/>
  </svg>
);

const PayoneerIcon = () => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <rect width="38" height="38" rx="10" fill="#FF4800"/>
    <text x="7" y="27" fontSize="20" fontWeight="900" fill="white" fontFamily="Arial">P</text>
    <circle cx="27" cy="14" r="4" fill="white" fillOpacity="0.25"/>
    <circle cx="27" cy="14" r="2.5" fill="white"/>
  </svg>
);

const FlutterwaveIcon = () => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <rect width="38" height="38" rx="10" fill="#F5A623"/>
    <path d="M8 22 Q13 16 19 20 Q25 24 30 18" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M8 27 Q13 21 19 25 Q25 29 30 23" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.6"/>
    <path d="M8 17 Q13 11 19 15 Q25 19 30 13" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.4"/>
  </svg>
);

const PaystackIcon = () => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <rect width="38" height="38" rx="10" fill="#00C3F7"/>
    <rect x="8" y="12" width="22" height="4" rx="2" fill="white"/>
    <rect x="8" y="19" width="22" height="4" rx="2" fill="white" fillOpacity="0.7"/>
    <rect x="8" y="26" width="14" height="4" rx="2" fill="white" fillOpacity="0.4"/>
  </svg>
);

const WiseIcon = () => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
    <rect width="38" height="38" rx="10" fill="#00B9FF"/>
    <path d="M7 19 L14 12 L21 19 L28 12 L35 19" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M7 26 L14 19 L21 26 L28 19 L35 26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeOpacity="0.5"/>
  </svg>
);

const methods = [
  { id: 'paypal',      name: 'PayPal',        Icon: PayPalIcon,      desc: 'Instant transfer',          fee: 0,   color: '#003087', badge: 'Instant' },
  { id: 'bank',        name: 'Bank Transfer', Icon: BankIcon,        desc: '1–3 business days',          fee: 0,   color: '#1E3A5F', badge: 'Free' },
  { id: 'payoneer',    name: 'Payoneer',      Icon: PayoneerIcon,    desc: 'Instant for members',        fee: 0,   color: '#FF4800', badge: 'Free' },
  { id: 'flutterwave', name: 'Flutterwave',   Icon: FlutterwaveIcon, desc: 'Africa & global',            fee: 1.4, color: '#F5A623', badge: '1.4%' },
  { id: 'paystack',    name: 'Paystack',      Icon: PaystackIcon,    desc: 'NG · GH · KE',              fee: 1.5, color: '#00C3F7', badge: '1.5%' },
  { id: 'wise',        name: 'Wise',          Icon: WiseIcon,        desc: 'Best intl rates',            fee: 0.5, color: '#00B9FF', badge: '0.5%' },
];

const StatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle size={16} className="text-green-500" />;
  if (status === 'failed')    return <XCircle size={16} className="text-red-500" />;
  return <Clock size={16} className="text-amber-500" />;
};

export default function CreatorWithdraw() {
  const { user } = useAuth();
  const [method, setMethod]           = useState('');
  const [amount, setAmount]           = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [processing, setProcessing]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [lastWithdrawal, setLastWithdrawal] = useState(null);
  const [history, setHistory]         = useState([]);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance || 0);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      supabase.from('creator_profiles').select('wallet_balance,pending_balance').eq('id', user.id).single(),
      getWithdrawalHistory(user.id),
    ]).then(([{ data: profile }, wds]) => {
      if (profile) setWalletBalance(profile.wallet_balance || 0);
      setHistory(wds);
    }).catch(() => {});
  }, [user?.id]);

  const selectedMethod = methods.find(m => m.id === method);
  const parsed  = parseFloat(amount) || 0;
  const feeAmt  = selectedMethod ? Math.round(parsed * selectedMethod.fee / 100 * 100) / 100 : 0;
  const netAmount = Math.round((parsed - feeAmt) * 100) / 100;

  const handleWithdraw = async () => {
    if (!method)              { toast.error('Please select a withdrawal method'); return; }
    if (parsed < 10)          { toast.error('Minimum withdrawal is $10'); return; }
    if (parsed > walletBalance){ toast.error('Insufficient balance'); return; }
    if (!accountInfo.trim())  { toast.error('Please enter your account details'); return; }
    setProcessing(true);
    try {
      const withdrawal = await submitWithdrawal({
        creatorId: user.id, amount: parsed,
        method: selectedMethod.name,
        accountDetails: accountInfo.trim(),
        walletBalance,
      });
      setLastWithdrawal({ ...withdrawal, netAmount, methodName: selectedMethod.name });
      setWalletBalance(prev => prev - parsed);
      setHistory(prev => [withdrawal, ...prev]);
      setSuccess(true);
    } catch (err) {
      toast.error(err.message || 'Withdrawal failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────── */
  if (success && lastWithdrawal) return (
    <DashboardLayout>
      <SEO title="Withdraw Funds" noindex={true} />
      <div className="max-w-md mx-auto py-16 text-center px-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <CheckCircle size={44} className="text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">Withdrawal Submitted!</h1>
          <p className="text-gray-500 mb-1">
            <strong className="text-gray-900 dark:text-white">{formatCurrency(lastWithdrawal.netAmount)}</strong> via{' '}
            <strong className="text-gray-900 dark:text-white">{lastWithdrawal.methodName}</strong>
          </p>
          <p className="text-gray-400 text-sm mb-8">Status: <span className="font-semibold text-amber-500">Pending review (within 24h)</span></p>
          <button
            onClick={() => { setSuccess(false); setAmount(''); setAccountInfo(''); setMethod(''); }}
            className="btn btn-outline btn-lg"
          >
            New Withdrawal
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );

  /* ── Main page ──────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <SEO title="Withdraw Funds" noindex={true} />
      <div className="max-w-2xl mx-auto pb-12">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowDownToLine size={22} className="text-wallet" /> Withdraw Funds
          </h1>
          <p className="text-gray-500 text-sm mt-1">Transfer your earnings to your preferred payment method</p>
        </div>

        {/* Balance hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] text-white p-7 mb-6"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-wallet/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={15} className="text-white/50" />
                <span className="text-white/60 text-sm">Available Balance</span>
              </div>
              <p className="font-heading font-extrabold text-5xl tracking-tight">
                {formatCurrency(walletBalance)}
              </p>
              <p className="text-white/40 text-xs mt-3 flex items-center gap-1">
                <Shield size={11} /> Minimum withdrawal: $10
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {['25%', '50%', 'Max'].map((label, i) => {
                const pct = i === 2 ? 100 : [25, 50][i];
                return (
                  <button
                    key={label}
                    onClick={() => setAmount(Math.round(walletBalance * pct / 100).toString())}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Method selection */}
        <div className="card p-6 mb-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Withdrawal Method</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {methods.map((m, i) => {
              const selected = method === m.id;
              return (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setMethod(m.id)}
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 text-center transition-all duration-200 group
                    ${selected
                      ? 'border-transparent shadow-lg scale-[1.02]'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm'
                    }`}
                  style={selected ? {
                    borderColor: m.color,
                    background: `${m.color}10`,
                    boxShadow: `0 4px 20px ${m.color}25`,
                  } : {}}
                >
                  {/* Fee badge */}
                  <span
                    className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: m.fee === 0 ? '#D1FAE5' : '#FEF3C7',
                      color: m.fee === 0 ? '#065F46' : '#92400E',
                    }}
                  >
                    {m.fee === 0 ? 'FREE' : m.badge}
                  </span>

                  <m.Icon />

                  <div>
                    <p className={`text-sm font-semibold transition-colors ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {m.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
                  </div>

                  {selected && (
                    <motion.div
                      layoutId="method-check"
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: m.color }}
                    >
                      <CheckCircle size={12} className="text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Amount + account details */}
        <div className="card p-6 mb-4 space-y-5">
          {/* Amount input */}
          <div>
            <label className="label">Amount (USD)</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                max={walletBalance}
                min={10}
                placeholder="0.00"
                className="input pl-9 pr-4 text-2xl font-bold h-14 tracking-tight"
              />
            </div>
            {parsed > 0 && parsed < 10 && (
              <p className="text-xs text-red-500 mt-1.5">Minimum withdrawal is $10</p>
            )}
            {parsed > walletBalance && (
              <p className="text-xs text-red-500 mt-1.5">Exceeds available balance</p>
            )}
          </div>

          {/* Account info */}
          <AnimatePresence>
            {method && (
              <motion.div
                key="account"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="label">
                  {method === 'paypal' ? 'PayPal Email Address'
                   : method === 'bank' ? 'Account Number / IBAN'
                   : method === 'wise' ? 'Wise Email or Account ID'
                   : method === 'payoneer' ? 'Payoneer Email'
                   : 'Account Details'}
                </label>
                <input
                  value={accountInfo}
                  onChange={e => setAccountInfo(e.target.value)}
                  placeholder={method === 'bank' ? 'e.g. GB29NWBK60161331926819' : 'e.g. you@email.com'}
                  className="input mt-1"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fee breakdown */}
          <AnimatePresence>
            {parsed > 0 && method && (
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</p>
                </div>
                <div className="px-4 py-3 space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Withdrawal amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(parsed)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Service fee {selectedMethod?.fee > 0 ? `(${selectedMethod.fee}%)` : ''}</span>
                    <span className={feeAmt > 0 ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                      {feeAmt > 0 ? `-${formatCurrency(feeAmt)}` : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-gray-100 dark:border-gray-800 pt-2.5">
                    <span className="text-gray-900 dark:text-white">You receive</span>
                    <span className="text-wallet text-base">{formatCurrency(netAmount)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 pt-0.5">via {selectedMethod?.name} · {selectedMethod?.desc}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 px-1">
          <Shield size={13} className="text-green-500 shrink-0" />
          All withdrawals are processed securely and reviewed within 24 hours.
        </div>

        {/* Submit button */}
        <button
          onClick={handleWithdraw}
          disabled={processing || !method || parsed < 10 || parsed > walletBalance || !accountInfo.trim()}
          className="btn btn-lg w-full disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', color: 'white' }}
        >
          {processing ? (
            <span className="flex items-center gap-2.5">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing…
            </span>
          ) : (
            <>
              <ArrowDownToLine size={18} />
              Withdraw {parsed >= 10 && method ? formatCurrency(netAmount) : 'Now'}
              <ChevronRight size={16} className="ml-auto opacity-60" />
            </>
          )}
        </button>

        {/* Withdrawal history */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 card p-6"
          >
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Withdrawal History</h2>
            <div className="space-y-2">
              {history.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                      ${w.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20'
                      : w.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      <StatusIcon status={w.status} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{w.method}</p>
                      <p className="text-xs text-gray-400">{timeAgo(w.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">-{formatCurrency(w.amount)}</p>
                      <span className={`text-[10px] font-semibold capitalize
                        ${w.status === 'completed' ? 'text-green-600'
                        : w.status === 'failed' ? 'text-red-500'
                        : 'text-amber-500'}`}>
                        {w.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
