import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../lib/admin';
import { formatCurrency, timeAgo } from '../../lib/normalize';

const STATUS_TABS = ['all', 'pending', 'processing', 'completed', 'failed'];

const statusStyle = {
  pending:    'bg-yellow-500/10 text-yellow-400',
  processing: 'bg-blue-500/10 text-blue-400',
  completed:  'bg-green-500/10 text-green-400',
  failed:     'bg-red-500/10 text-red-400',
};

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    getAdminWithdrawals({ status, limit: 50 })
      .then(setWithdrawals)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]);

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await approveWithdrawal(id);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'completed' } : w));
      toast.success('Withdrawal approved ✓');
    } catch { toast.error('Failed'); } finally { setActing(null); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this withdrawal? The amount will be refunded to the creator.')) return;
    setActing(id);
    try {
      await rejectWithdrawal(id);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'failed' } : w));
      toast.success('Withdrawal rejected. Amount refunded.');
    } catch { toast.error('Failed'); } finally { setActing(null); }
  };

  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-heading font-bold text-white">Withdrawals</h1>
          <p className="text-gray-500 text-sm">{withdrawals.filter(w => w.status === 'pending').length} pending · {formatCurrency(totalPending)} to pay out</p>
        </div>
      </div>

      <div className="flex gap-1 bg-[#111118] border border-gray-700 rounded-xl p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatus(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${status === t ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading withdrawals...</div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No withdrawals found</div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-[#111118] border border-gray-800 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
              <img src={w.creator_profiles?.avatar_url || `https://i.pravatar.cc/40?u=${w.creator_id}`} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white">{w.creator_profiles?.name || 'Creator'}</p>
                <p className="text-xs text-gray-500">@{w.creator_profiles?.username} · via {w.method}</p>
                {w.account_details && <p className="text-xs text-gray-600 mt-0.5 truncate max-w-xs">{w.account_details}</p>}
              </div>
              <div className="text-right flex-shrink-0 mr-2">
                <p className="font-heading font-bold text-xl text-white">{formatCurrency(w.amount)}</p>
                <p className="text-xs text-gray-500">balance after: {formatCurrency((w.creator_profiles?.wallet_balance || 0))}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle[w.status] || 'bg-gray-700 text-gray-400'}`}>
                  {w.status}
                </span>
                {w.status === 'pending' && (
                  <>
                    <button onClick={() => handleReject(w.id)} disabled={acting === w.id}
                      className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50">
                      <XCircle size={18} />
                    </button>
                    <button onClick={() => handleApprove(w.id)} disabled={acting === w.id}
                      className="p-2 rounded-xl text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all disabled:opacity-50">
                      <CheckCircle size={18} />
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600 w-full sm:w-auto">{timeAgo(w.created_at)}</p>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
