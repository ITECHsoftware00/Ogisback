import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Users, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { NicheBadge } from '../../components/ui/Badge';
import { getCampaignById, campaigns, formatCurrency } from '../../data';

export default function CreatorCampaignDetail() {
  const { id } = useParams();
  const campaign = getCampaignById(id) || campaigns[0];
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000));

  return (
    <DashboardLayout>
      <Link to="/creator/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to campaigns
      </Link>

      <div className="relative h-48 rounded-3xl overflow-hidden mb-6">
        <img src={campaign.image} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <img src={campaign.brandLogo} alt="" className="w-12 h-12 rounded-2xl border-2 border-white object-cover" />
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
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{campaign.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">{campaign.niche.map(n => <NicheBadge key={n} niche={n} />)}</div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">Deliverables</h2>
            <ul className="space-y-2">{campaign.deliverables.map((d, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle size={15} className="text-creator flex-shrink-0" /> {d}
              </li>
            ))}</ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <div className="p-3 bg-wallet/5 rounded-xl flex items-center gap-3">
              <DollarSign size={20} className="text-wallet" />
              <div>
                <p className="text-xs text-gray-500">Budget</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(campaign.budget.min)} – {formatCurrency(campaign.budget.max)}</p>
              </div>
            </div>
            <div className="p-3 bg-brand/5 rounded-xl flex items-center gap-3">
              <Calendar size={20} className="text-brand" />
              <div>
                <p className="text-xs text-gray-500">Deadline</p>
                <p className="font-bold text-gray-900 dark:text-white">{daysLeft} days left</p>
              </div>
            </div>
            <div className="p-3 bg-primary/5 rounded-xl flex items-center gap-3">
              <Users size={20} className="text-primary" />
              <div>
                <p className="text-xs text-gray-500">Competition</p>
                <p className="font-bold text-gray-900 dark:text-white">{campaign.applicants} applicants</p>
              </div>
            </div>
          </div>
          <button onClick={() => toast.success('Application submitted!')} className="btn btn-creator btn-lg w-full">Apply Now</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
