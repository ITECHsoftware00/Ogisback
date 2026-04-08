import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Users, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { NicheBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getCampaignById, applyToCampaign, getCreatorApplications } from '../../lib/db';
import { normalizeCampaign, formatCurrency } from '../../lib/normalize';

export default function CreatorCampaignDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(false);
  const [pitch, setPitch] = useState('');
  const [proposedRate, setProposedRate] = useState('');
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    getCampaignById(id)
      .then(c => setCampaign(normalizeCampaign(c)))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (user?.id) {
      getCreatorApplications(user.id)
        .then(apps => setAlreadyApplied(apps.some(a => a.campaign_id === id)))
        .catch(() => {});
    }
  }, [id, user?.id]);

  const handleApply = async () => {
    if (!pitch.trim()) { toast.error('Please write a pitch'); return; }
    setApplying(true);
    try {
      await applyToCampaign(id, user.id, pitch, parseFloat(proposedRate) || null);
      toast.success('Application submitted! The brand will review your pitch.');
      setAlreadyApplied(true);
      setApplyModal(false); setPitch(''); setProposedRate('');
    } catch (err) { toast.error(err.message || 'Failed to apply'); } finally { setApplying(false); }
  };

  if (loading) return <DashboardLayout><div className="text-center py-24 text-gray-400">Loading...</div></DashboardLayout>;
  if (!campaign) return <DashboardLayout><div className="text-center py-24"><p className="font-heading font-bold text-xl mb-4">Campaign not found</p><Link to="/creator/campaigns" className="btn btn-creator btn-md">Back</Link></div></DashboardLayout>;

  const daysLeft = campaign.deadline ? Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000)) : null;

  return (
    <DashboardLayout>
      <SEO title="Campaign Details" noindex={true} />
      <Link to="/creator/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to campaigns
      </Link>

      <div className="relative h-48 rounded-3xl overflow-hidden mb-6 bg-gradient-to-r from-primary/70 to-creator/70">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <img src={campaign.brandLogo || `https://i.pravatar.cc/48?u=${campaign.brand_id}`} alt="" className="w-12 h-12 rounded-2xl border-2 border-white object-cover" />
          <div>
            <p className="text-white font-heading font-bold text-xl">{campaign.title}</p>
            <p className="text-white/80 text-sm">by {campaign.brand}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="section-title">About this Campaign</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{campaign.description || '—'}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">{(campaign.niche || []).map(n => <NicheBadge key={n} niche={n} />)}</div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">Deliverables</h2>
            {(campaign.deliverables || []).length > 0 ? (
              <ul className="space-y-2">{campaign.deliverables.map((d, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={15} className="text-creator flex-shrink-0" /> {d}
                </li>
              ))}</ul>
            ) : <p className="text-sm text-gray-400">No deliverables specified.</p>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="p-3 bg-wallet/5 rounded-xl flex items-center gap-3">
              <DollarSign size={20} className="text-wallet" />
              <div>
                <p className="text-xs text-gray-500">Budget</p>
                <p className="font-bold text-gray-900 dark:text-white">
                  {campaign.budget?.min && campaign.budget?.max
                    ? `${formatCurrency(campaign.budget.min)} – ${formatCurrency(campaign.budget.max)}`
                    : '—'}
                </p>
              </div>
            </div>
            {daysLeft !== null && (
              <div className="p-3 bg-brand/5 rounded-xl flex items-center gap-3">
                <Calendar size={20} className="text-brand" />
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="font-bold text-gray-900 dark:text-white">{daysLeft} days left</p>
                </div>
              </div>
            )}
            <div className="p-3 bg-primary/5 rounded-xl flex items-center gap-3">
              <Users size={20} className="text-primary" />
              <div>
                <p className="text-xs text-gray-500">Competition</p>
                <p className="font-bold text-gray-900 dark:text-white">{campaign.applicants} applicants</p>
              </div>
            </div>
          </div>
          {alreadyApplied ? (
            <div className="btn btn-outline btn-lg w-full pointer-events-none opacity-60">Already Applied</div>
          ) : (
            <button onClick={() => setApplyModal(true)} className="btn btn-creator btn-lg w-full">Apply Now</button>
          )}
        </div>
      </div>

      <Modal isOpen={applyModal} onClose={() => setApplyModal(false)} title={`Apply to ${campaign.title}`}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Your Pitch *</label>
            <textarea value={pitch} onChange={e => setPitch(e.target.value)} placeholder="Tell the brand why you're a great fit, highlight relevant work and your audience..." rows={5} className="input resize-none" />
          </div>
          <div className="form-group">
            <label className="label">Proposed Rate (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input type="number" value={proposedRate} onChange={e => setProposedRate(e.target.value)} placeholder={campaign.budget?.max?.toString() || '500'} className="input pl-8" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setApplyModal(false)} className="btn btn-outline btn-md flex-1">Cancel</button>
            <button onClick={handleApply} disabled={applying} className="btn btn-creator btn-md flex-1 disabled:opacity-70">
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
