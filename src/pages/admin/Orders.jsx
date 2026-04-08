import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { StatusBadge } from '../../components/ui/Badge';
import { getAdminOrders } from '../../lib/admin';
import { formatCurrency, timeAgo } from '../../lib/normalize';

const STATUS_TABS = ['all', 'active', 'in_review', 'delivered', 'completed', 'revision_requested', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getAdminOrders({ status, search: search || undefined, limit: 50 })
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-heading font-bold text-white">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} orders loaded</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="bg-[#111118] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 w-56" />
        </div>
      </div>

      <div className="flex gap-1 bg-[#111118] border border-gray-700 rounded-xl p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatus(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-all ${status === t ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No orders found</div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Creator</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Brand</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {orders.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white truncate max-w-[180px]">{o.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">#{o.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <img src={o.creator_profiles?.avatar_url || `https://i.pravatar.cc/28?u=${o.creator_id}`} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      <p className="text-xs text-gray-300">{o.creator_profiles?.name || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <img src={o.brand_profiles?.logo_url || `https://i.pravatar.cc/28?u=${o.brand_id}`} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      <p className="text-xs text-gray-300">{o.brand_profiles?.name || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-white">{formatCurrency(o.amount)}</p>
                    <p className="text-xs text-gray-500">fee: {formatCurrency(o.amount * 0.2)}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">{timeAgo(o.created_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
