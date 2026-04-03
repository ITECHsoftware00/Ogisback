import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CampaignCard from '../../components/CampaignCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { campaigns, getCampaignById } from '../../data';
import SEO from '../../components/SEO';

export default function CreatorCampaigns() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('browse');
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyNote, setApplyNote] = useState('');

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const filtered = activeCampaigns.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.brand.toLowerCase().includes(search.toLowerCase())
  );
  const applied = campaigns.filter(c => ['camp1', 'camp5'].includes(c.id));

  const handleApply = async () => {
    if (!applyNote.trim()) { toast.error('Please write a short pitch'); return; }
    setApplying(true);
    await new Promise(r => setTimeout(r, 1200));
    setApplying(false);
    setSelected(null);
    setApplyNote('');
    toast.success('Application submitted! The brand will review your profile.');
  };

  return (
    <DashboardLayout>
      <SEO title="Campaigns" noindex={true} />
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">{activeCampaigns.length} active campaigns matching your profile</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {['browse', 'applied'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-creator text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            {t} {t === 'applied' && `(${applied.length})`}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div className="relative max-w-md mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns or brands..." className="input pl-10" />
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Megaphone} title="No campaigns found" description="Try adjusting your search or check back later." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(c => (
                <CampaignCard key={c.id} campaign={c} onApply={() => setSelected(c)} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'applied' && (
        applied.length === 0 ? (
          <EmptyState icon={Megaphone} title="No applications yet" description="Browse active campaigns and apply to start getting brand deals." action={<button onClick={() => setTab('browse')} className="btn btn-creator btn-md">Browse Campaigns</button>} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {applied.map(c => (
              <div key={c.id} className="relative">
                <CampaignCard campaign={c} />
                <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Applied</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Apply Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Apply to: ${selected?.title}`}>
        {selected && (
          <div>
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <img src={selected.brandLogo} alt="" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{selected.brand}</p>
                <p className="text-xs text-gray-500">${selected.budget.min.toLocaleString()} – ${selected.budget.max.toLocaleString()}</p>
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="label">Your pitch to the brand *</label>
              <textarea value={applyNote} onChange={e => setApplyNote(e.target.value)} placeholder="Tell the brand why you're a great fit. Mention your audience, past collabs, and ideas for the campaign..." rows={5} className="input resize-none" />
            </div>
            <div className="form-group mb-6">
              <label className="label">Your proposed rate ($)</label>
              <input type="number" placeholder={`Suggested: ${selected.budget.min}`} className="input" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="btn btn-outline btn-md flex-1">Cancel</button>
              <button onClick={handleApply} disabled={applying} className="btn btn-creator btn-md flex-1 disabled:opacity-70">
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
