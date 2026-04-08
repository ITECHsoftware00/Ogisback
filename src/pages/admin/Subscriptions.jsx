import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminSubscriptions } from '../../lib/admin';
import { timeAgo } from '../../lib/normalize';

const statusStyle = {
  active:    'bg-green-500/10 text-green-400',
  trialing:  'bg-blue-500/10 text-blue-400',
  cancelled: 'bg-gray-700 text-gray-400',
  past_due:  'bg-red-500/10 text-red-400',
};

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSubscriptions({ limit: 100 })
      .then(setSubs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = subs.filter(s => s.status === 'active' || s.status === 'trialing');
  const byPlan = active.reduce((acc, s) => { acc[s.plan] = (acc[s.plan] || 0) + 1; return acc; }, {});

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-heading font-bold text-white">Subscriptions</h1>
        <p className="text-gray-500 text-sm">{active.length} active · {Object.entries(byPlan).map(([k, v]) => `${v} ${k}`).join(' · ')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active', value: active.length, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Trialing', value: subs.filter(s => s.status === 'trialing').length, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Cancelled', value: subs.filter(s => s.status === 'cancelled').length, color: 'text-gray-400', bg: 'bg-gray-700' },
          { label: 'Past Due', value: subs.filter(s => s.status === 'past_due').length, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${c.bg} rounded-2xl p-5 border border-gray-800`}>
            <p className={`text-3xl font-heading font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Renews</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {subs.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 text-xs text-gray-400 font-mono">{s.user_id?.slice(0, 12)}...</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.profiles?.role === 'creator' ? 'bg-creator/10 text-creator' : 'bg-brand/10 text-brand'}`}>
                      {s.profiles?.role || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.plan === 'max' ? 'bg-yellow-500/10 text-yellow-400' : s.plan === 'mini' ? 'bg-primary/10 text-primary' : 'bg-gray-700 text-gray-400'}`}>
                      {s.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400 capitalize">{s.billing_cycle}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle[s.status] || 'bg-gray-700 text-gray-400'}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">
                    {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">{timeAgo(s.created_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
