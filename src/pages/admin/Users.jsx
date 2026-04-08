import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, Shield, UserX, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminUsers, verifyCreator, banUser } from '../../lib/admin';
import { formatNumber, timeAgo } from '../../lib/normalize';

const ROLE_TABS = ['all', 'creator', 'brand'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    getAdminUsers({ role: role === 'all' ? undefined : role, search: search || undefined, limit: 50 })
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [role]);
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleVerify = async (id, current) => {
    try {
      await verifyCreator(id, !current);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: !current } : u));
      toast.success(current ? 'Verification removed' : 'Creator verified ✓');
    } catch { toast.error('Failed'); }
  };

  const handleBan = async (id) => {
    if (!confirm('Ban this user? This removes their plan and marks profile incomplete.')) return;
    try {
      await banUser(id);
      toast.success('User banned');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-heading font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm">{users.length} users loaded</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="bg-[#111118] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 w-56" />
          </div>
          <div className="flex bg-[#111118] border border-gray-700 rounded-xl p-1 gap-0.5">
            {ROLE_TABS.map(t => (
              <button key={t} onClick={() => setRole(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${role === t ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No users found</div>
      ) : (
        <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Plan</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Stats</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar_url || u.logo_url || `https://i.pravatar.cc/32?u=${u.id}`} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                          {u.verified && <CheckCircle size={13} className="text-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{u.username ? `@${u.username}` : u.slug || u.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === 'creator' ? 'bg-creator/10 text-creator' : 'bg-brand/10 text-brand'}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.profiles?.plan === 'max' ? 'bg-yellow-500/10 text-yellow-400' : u.profiles?.plan === 'mini' ? 'bg-primary/10 text-primary' : 'bg-gray-700 text-gray-400'}`}>
                      {u.profiles?.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-400">
                    {u.role === 'creator' ? (
                      <span>{formatNumber(u.total_followers || 0)} followers · {u.rating ? `${u.rating}★` : 'No reviews'}</span>
                    ) : (
                      <span>${(u.wallet_balance || 0).toLocaleString()} balance</span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-xs text-gray-500">
                    {timeAgo(u.profiles?.created_at || u.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {u.role === 'creator' && (
                        <button onClick={() => handleVerify(u.id, u.verified)} title={u.verified ? 'Remove verification' : 'Verify creator'}
                          className={`p-1.5 rounded-lg transition-all ${u.verified ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-gray-500 hover:text-primary hover:bg-primary/10'}`}>
                          <Shield size={14} />
                        </button>
                      )}
                      <button onClick={() => handleBan(u.id)} title="Ban user"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <UserX size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
