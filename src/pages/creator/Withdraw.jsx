import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, CreditCard, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

const methods = [
  { id: 'paypal', name: 'PayPal', icon: '🅿', desc: 'Instant · paypal.me/handle', fee: '0%' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', desc: '1-3 business days', fee: '0%' },
  { id: 'payoneer', name: 'Payoneer', icon: '💳', desc: 'Instant for Payoneer users', fee: '0%' },
  { id: 'flutterwave', name: 'Flutterwave', icon: '🌊', desc: 'Africa & global · Instant', fee: '1.4%' },
  { id: 'paystack', name: 'Paystack', icon: '🔵', desc: 'Nigeria · Ghana · Kenya', fee: '1.5%' },
  { id: 'wise', name: 'Wise', icon: '🌐', desc: 'Best international rates', fee: '0.5%' },
];

export default function CreatorWithdraw() {
  const { user } = useAuth();
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const balance = user?.walletBalance || 3120;
  const selectedMethod = methods.find(m => m.id === method);
  const fee = selectedMethod ? Math.round(parseFloat(amount || 0) * parseFloat(selectedMethod.fee) / 100) : 0;
  const netAmount = Math.round(parseFloat(amount || 0) - fee);

  const handleWithdraw = async () => {
    if (!method) { toast.error('Please select a withdrawal method'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Please enter a valid amount'); return; }
    if (parseFloat(amount) > balance) { toast.error('Insufficient balance'); return; }
    if (!accountInfo.trim()) { toast.error('Please enter your account details'); return; }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setSuccess(true);
  };

  if (success) return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </motion.div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">Withdrawal Initiated!</h1>
        <p className="text-gray-500 mb-2">Your withdrawal of <strong>{formatCurrency(netAmount)}</strong> via {selectedMethod?.name} has been processed.</p>
        <p className="text-gray-400 text-sm mb-8">Funds will arrive based on your chosen method's processing time.</p>
        <button onClick={() => setSuccess(false)} className="btn btn-outline btn-lg">Make Another Withdrawal</button>
      </div>
    </DashboardLayout>
  );

  const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2"><ArrowDownToLine size={22} className="text-wallet" />Withdraw Funds</h1>
          <p className="page-subtitle">Transfer your earnings to your preferred payment method</p>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl bg-gradient-to-br from-wallet to-orange-400 text-white p-6 mb-6">
          <p className="text-white/80 text-sm mb-1">Available to Withdraw</p>
          <p className="font-heading font-extrabold text-4xl">${balance.toLocaleString()}</p>
          <p className="text-white/60 text-xs mt-2">+ ${user?.pendingBalance?.toLocaleString() || '2,240'} pending in escrow</p>
        </div>

        {/* Method selection */}
        <div className="card p-6 mb-4">
          <label className="label mb-3">Withdrawal Method</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {methods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all ${method === m.id ? 'border-wallet bg-wallet/5 text-wallet' : 'border-gray-100 dark:border-gray-800 hover:border-wallet/40 text-gray-500'}`}
              >
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</p>
                  <p className="text-[10px] text-gray-400">{m.fee === '0%' ? 'No fee' : `Fee: ${m.fee}`}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount + account */}
        <div className="card p-6 mb-4 space-y-4">
          <div className="form-group">
            <label className="label">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} max={balance} placeholder="0.00" className="input pl-8 text-lg font-semibold" />
            </div>
            <div className="flex gap-2 mt-2">
              {[25, 50, 100].map(pct => (
                <button key={pct} onClick={() => setAmount(Math.round(balance * pct / 100).toString())} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-wallet/10 hover:text-wallet transition-all">
                  {pct}%
                </button>
              ))}
              <button onClick={() => setAmount(balance.toString())} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-wallet/10 hover:text-wallet transition-all">Max</button>
            </div>
          </div>

          {method && (
            <div className="form-group">
              <label className="label">{method === 'paypal' ? 'PayPal Email' : method === 'bank' ? 'Bank Account Number / IBAN' : method === 'wise' ? 'Wise Email or Account ID' : 'Account Details'}</label>
              <input value={accountInfo} onChange={e => setAccountInfo(e.target.value)} placeholder={method === 'bank' ? 'Account number or IBAN...' : 'Email or account ID...'} className="input" />
            </div>
          )}

          {amount && parseFloat(amount) > 0 && method && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Withdrawal amount</span><span className="font-medium">{formatCurrency(parseFloat(amount))}</span></div>
              {fee > 0 && <div className="flex justify-between"><span className="text-gray-500">Service fee ({selectedMethod?.fee})</span><span className="text-red-500">-{formatCurrency(fee)}</span></div>}
              <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                <span>You receive</span><span className="text-wallet">{formatCurrency(netAmount)}</span>
              </div>
              <p className="text-xs text-gray-400">via {selectedMethod?.name} · {selectedMethod?.desc}</p>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
          <Shield size={13} /> All withdrawals are processed securely. Minimum withdrawal: $10
        </div>

        <button onClick={handleWithdraw} disabled={processing || !method || !amount} className="btn btn-lg w-full disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: 'white' }}>
          {processing ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span> : <><ArrowDownToLine size={18} />Withdraw {amount ? formatCurrency(netAmount) : 'Now'}</>}
        </button>
      </div>
    </DashboardLayout>
  );
}
