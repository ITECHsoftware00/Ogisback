import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { getAdminCampaigns, updateCampaignStatus } from '../../lib/admin';
import { formatCurrency, timeAgo } from '../../lib/normalize';

const STATUS_TABS = ['all', 'active', 'draft', 'completed', 'cancelled'];

const statusStyle = {
  active:    'bg-green-500/10 text-green-400',
  draft:     'bg-gray-700 text-gray-400',
  completed: 'bg-blue-500/10 text-blue-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');

  const load = () => {
    setLoading(true);
    getAdminCampaigns({ status, limit: 50 })
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]);

  const handleStatus = async (id, newStatus) => {
    try {
      await updateCampaignStatus(id, newStatus);
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Campaign ${newStatus}`);
    } catch { toast.error('Failed'); }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-heading font-bold text-white">Campaigns</h1>
        <p className="text-gray-500 text-sm">{campaigns.length} campaigns loaded</p>
      </div>

      <div className="flex gap-1 bg-[#111118] border border-gray-700 rounded-xl p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatus(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${status === t ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-600">No campaigns found</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-[#111118] border border-gray-800 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
              <img src={c.brand_profiles?.logo_url || `https://i.pravatar.cc/40?u=${c.brand_id}`} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.brand_profiles?.name} · {c.applicant_count || 0} applicants · {c.hired_count || 0} hired</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(c.niche || []).slice(0, 3).map(n => (
                    <span key={n} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{n}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0 mr-2">
                {c.budget_min && c.budget_max && (
                  <p className="text-sm font-bold text-white">{formatCurrency(c.budget_min)}–{formatCurrency(c.budget_max)}</p>
                )}
                <p className="text-xs text-gray-500">{c.deadline ? `Due ${new Date(c.deadline).toLocaleDateString()}` : 'No deadline'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle[c.status] || 'bg-gray-700 text-gray-400'}`}>{c.status}</span>
                {c.status !== 'cancelled' && (
                  <button onClick={() => handleStatus(c.id, 'cancelled')} title="Cancel campaign"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <XCircle size={15} />
                  </button>
                )}
                {c.status === 'draft' && (
                  <button onClick={() => handleStatus(c.id, 'active')} title="Activate campaign"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition-all">
                    <CheckCircle size={15} />
                  </button>
                )}
                {c.status === 'active' && (
                  <button onClick={() => handleStatus(c.id, 'paused')} title="Pause campaign"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all">
                    <Pause size={15} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600 w-full">{timeAgo(c.created_at)}</p>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
