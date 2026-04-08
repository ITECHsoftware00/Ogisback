import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminEscrow } from '../../lib/admin';
import { formatCurrency, timeAgo } from '../../lib/normalize';

const STATUS_TABS = ['all', 'held', 'released', 'refunded', 'disputed'];

const statusStyle = {
  held:     'bg-orange-500/10 text-orange-400',
  released: 'bg-green-500/10 text-green-400',
  refunded: 'bg-blue-500/10 text-blue-400',
  disputed: 'bg-red-500/10 text-red-400',
};

export default function AdminEscrow() {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');

  useEffect(() => {
    setLoading(true);
    getAdminEscrow({ status, limit: 50 })
      .then(setEscrows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const totalHeld = escrows.filter(e => e.status === 'held').reduce((s, e) => s + e.amount, 0);
  const totalFees = escrows.filter(e => e.status === 'released').reduce((s, e) => s + e.platform_fee, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-heading font-bold text-white">Escrow Ledger</h1>
        <p className="text-gray-500 text-sm">{formatCurrency(totalHeld)} held · {formatCurrency(totalFees)} earned in fees</p>
      </div>

      <div className="flex gap-1 bg-[#111118] border border-gray-700 rounded-xl p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatus(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${status === t ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : escrows.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No escrow records found</div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Brand → Creator</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Fee</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {escrows.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white truncate max-w-[160px]">{e.orders?.title || 'Order'}</p>
                    <p className="text-xs text-gray-500">#{e.order_id?.slice(0, 8)}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <span className="truncate max-w-[80px]">{e.brand_profiles?.name}</span>
                      <span className="text-gray-600">→</span>
                      <span className="truncate max-w-[80px]">{e.creator_profiles?.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-white">{formatCurrency(e.amount)}</p>
                    <p className="text-xs text-gray-500">payout: {formatCurrency(e.creator_payout)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-wallet">{formatCurrency(e.platform_fee)}</p>
                    <p className="text-xs text-gray-500">{Math.round((e.fee_rate || 0.2) * 100)}% rate</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle[e.status] || 'bg-gray-700 text-gray-400'}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">{timeAgo(e.created_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
