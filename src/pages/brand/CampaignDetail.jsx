import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, Clock, DollarSign, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { NicheBadge } from '../../components/ui/Badge';
import CreatorCard from '../../components/CreatorCard';
import { getCampaignById, campaigns, creators, formatCurrency } from '../../data';

export default function BrandCampaignDetail() {
  const { id } = useParams();
  const campaign = getCampaignById(id) || campaigns[0];
  const [tab, setTab] = useState('overview');
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000));
  const applicantCreators = creators.slice(0, campaign.applicants > creators.length ? creators.length : Math.min(campaign.applicants, creators.length));

  return (
    <DashboardLayout>
      <Link to="/brand/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to campaigns
      </Link>

      <div className="relative h-48 rounded-3xl overflow-hidden mb-6">
        <img src={campaign.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h1 className="text-white font-heading font-bold text-2xl">{campaign.title}</h1>
          <p className="text-white/70 text-sm mt-0.5">{campaign.type}</p>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <button onClick={() => toast.success('Edit mode (demo)')} className="p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all"><Edit3 size={15} /></button>
          <button onClick={() => toast.error('Deleted (demo)')} className="p-2 bg-red-500/80 backdrop-blur-sm rounded-xl text-white hover:bg-red-600 transition-all"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Budget', value: `${formatCurrency(campaign.budget.min)}–${formatCurrency(campaign.budget.max)}`, icon: DollarSign, color: 'text-wallet' },
          { label: 'Days Left', value: `${daysLeft}d`, icon: Clock, color: 'text-brand' },
          { label: 'Applicants', value: campaign.applicants, icon: Users, color: 'text-primary' },
          { label: 'Hired', value: campaign.hired, icon: CheckCircle, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div><p className="font-heading font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 w-fit mb-6">
        {['overview', 'applicants'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            {t} {t === 'applicants' && `(${campaign.applicants})`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="section-title">Brief</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{campaign.description}</p>
            <div className="flex flex-wrap gap-1.5">{campaign.niche.map(n => <NicheBadge key={n} niche={n} />)}</div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">Deliverables</h2>
            <ul className="space-y-2">{campaign.deliverables.map((d, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 p-2.5 bg-brand/5 rounded-xl">
                <CheckCircle size={14} className="text-brand" />{d}
              </li>
            ))}</ul>
          </div>
        </div>
      )}

      {tab === 'applicants' && (
        <div>
          {applicantCreators.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No applicants yet. Share your campaign link to attract creators.</div>
          ) : (
            <div className="creator-grid">
              {applicantCreators.map(c => (
                <div key={c.id} className="relative">
                  <CreatorCard creator={c} linkPrefix="/brand/discover"
                    onHire={() => toast.success(`Hiring ${c.name}! Proposal sent.`)}
                    onMessage={() => toast.success('Opening chat...')} />
                  <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Applied</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
