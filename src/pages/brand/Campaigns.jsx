import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Megaphone, Edit3, Trash2, Eye, X, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import SEO from '../../components/SEO';
import { getBrandCampaigns, updateCampaign, deleteCampaign } from '../../lib/db';
import { formatCurrency } from '../../lib/normalize';
import { useAuth } from '../../context/AuthContext';

const statusColors = { active: 'badge-success', draft: 'badge-gray', completed: 'badge-brand' };
const STATUSES = ['active', 'draft', 'completed'];

export default function BrandCampaigns() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editCampaign, setEditCampaign] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', status: '', deadline: '' });
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getBrandCampaigns(user.id)
      .then(data => setCampaigns(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = campaigns.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const activeCount = campaigns.filter(c => c.status === 'active').length;

  const openEdit = (c) => {
    setEditCampaign(c);
    setEditForm({
      title: c.title,
      status: c.status,
      deadline: c.deadline ? c.deadline.split('T')[0] : '',
    });
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) { toast.error('Title is required'); return; }
    setEditSaving(true);
    try {
      const updated = await updateCampaign(editCampaign.id, {
        title: editForm.title.trim(),
        status: editForm.status,
        deadline: editForm.deadline || null,
      });
      setCampaigns(cs => cs.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      toast.success('Campaign updated');
      setEditCampaign(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update campaign');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCampaign(deleteId);
      setCampaigns(cs => cs.filter(c => c.id !== deleteId));
      toast.success('Campaign deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <SEO title="My Campaigns" noindex={true} />
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">My Campaigns</h1>
          <p className="page-subtitle">{activeCount} active campaigns</p>
        </div>
        <Link to="/brand/campaigns/new" className="btn btn-brand btn-md">
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="input pl-9 text-sm" />
        </div>
        <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          {['all', 'active', 'draft', 'completed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading campaigns...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns found" description="Create your first campaign to start finding creators." action={<Link to="/brand/campaigns/new" className="btn btn-brand btn-md"><Plus size={16} />New Campaign</Link>} />
      ) : (
        <div className="space-y-4">
          {filtered.map((campaign, i) => {
            const daysLeft = campaign.deadline ? Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000)) : '—';
            return (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card overflow-hidden hover:shadow-card-hover transition-all">
                <div className="flex gap-4 p-5">
                  {campaign.image_url && (
                    <img src={campaign.image_url} alt="" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div>
                        <h3 className="font-heading font-bold text-gray-900 dark:text-white">{campaign.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{campaign.content_type}</p>
                      </div>
                      <span className={`badge ${statusColors[campaign.status] || 'badge-gray'}`}>{campaign.status}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div><p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(campaign.budget_min)}–{formatCurrency(campaign.budget_max)}</p><p className="text-[10px] text-gray-400">Budget</p></div>
                      <div><p className="font-bold text-sm text-gray-900 dark:text-white">{typeof daysLeft === 'number' ? `${daysLeft}d` : daysLeft}</p><p className="text-[10px] text-gray-400">Remaining</p></div>
                      <div><p className="font-bold text-sm text-gray-900 dark:text-white">{campaign.applicant_count || 0}</p><p className="text-[10px] text-gray-400">Applied</p></div>
                      <div><p className="font-bold text-sm text-gray-900 dark:text-white">{campaign.hired_count || 0}</p><p className="text-[10px] text-gray-400">Hired</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 justify-start">
                    <Link to={`/brand/campaigns/${campaign.id}`} className="p-2 text-gray-400 hover:text-brand rounded-lg hover:bg-brand/10 transition-all"><Eye size={15} /></Link>
                    <button onClick={() => openEdit(campaign)} className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-all"><Edit3 size={15} /></button>
                    <button onClick={() => setDeleteId(campaign.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><Trash2 size={15} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !editSaving && setEditCampaign(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading font-bold text-gray-900 dark:text-white">Edit Campaign</h2>
                <button onClick={() => setEditCampaign(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Campaign Title</label>
                  <input
                    value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    className="input"
                    placeholder="Campaign title"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="input appearance-none cursor-pointer"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label flex items-center gap-1.5"><Calendar size={13} />Deadline</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditCampaign(null)} className="btn btn-outline btn-md flex-1" disabled={editSaving}>Cancel</button>
                <button onClick={saveEdit} disabled={editSaving} className="btn btn-brand btn-md flex-1 disabled:opacity-60">
                  {editSaving ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                  ) : (
                    <><CheckCircle size={15} /> Save Changes</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !deleting && setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h2 className="font-heading font-bold text-gray-900 dark:text-white mb-2">Delete Campaign?</h2>
              <p className="text-sm text-gray-500 mb-6">This will permanently remove the campaign and all applications. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn btn-outline btn-md flex-1" disabled={deleting}>Cancel</button>
                <button onClick={confirmDelete} disabled={deleting} className="btn bg-red-500 hover:bg-red-600 text-white btn-md flex-1 disabled:opacity-60">
                  {deleting ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
                  ) : 'Delete Campaign'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
