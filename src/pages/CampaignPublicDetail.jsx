import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, DollarSign, CheckCircle, Building2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { NicheBadge } from '../components/ui/Badge';
import { campaigns, brands, getCampaignById, formatCurrency } from '../data';
import { useAuth } from '../context/AuthContext';
import SEO, { campaignSchema } from '../components/SEO';

export default function CampaignPublicDetail() {
  const { id } = useParams();
  const { isLoggedIn, isCreator } = useAuth();
  const navigate = useNavigate();
  const campaign = getCampaignById(id) || campaigns[0];
  const brand = brands.find(b => b.id === campaign.brandId);
  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000));

  const handleApply = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    toast.success('Application submitted!');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <SEO
        title={`${campaign.title} — Campaign by ${campaign.brand}`}
        description={campaign.description || `${campaign.brand} is hiring creators for "${campaign.title}". Apply now on OgisBack.`}
        image={campaign.image}
        url={`/campaign/${campaign.id}`}
        structuredData={campaignSchema({
          title: campaign.title,
          description: campaign.description,
          brand: campaign.brand,
          image: campaign.image,
          url: `/campaign/${campaign.id}`,
        })}
      />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/explore" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to explore
        </Link>

        {/* Hero image */}
        <div className="relative h-56 rounded-3xl overflow-hidden mb-6">
          <img src={campaign.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <img src={campaign.brandLogo} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-white" />
            <div>
              <p className="text-white font-heading font-bold text-lg">{campaign.title}</p>
              <p className="text-white/80 text-sm">by {campaign.brand}</p>
            </div>
          </div>
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${campaign.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
            {campaign.status === 'active' ? 'Active' : 'Closed'}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <div className="card p-6">
              <h2 className="section-title">Campaign Overview</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{campaign.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {campaign.niche.map(n => <NicheBadge key={n} niche={n} />)}
              </div>
            </div>

            {/* Deliverables */}
            <div className="card p-6">
              <h2 className="section-title">What's Required</h2>
              <ul className="space-y-2">
                {campaign.deliverables.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle size={15} className="text-brand flex-shrink-0" /> {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="card p-6">
              <h2 className="section-title">Creator Requirements</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Minimum Followers</span>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{campaign.requirements.minFollowers?.toLocaleString()}+</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Platforms</span>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white capitalize">{campaign.requirements.platforms?.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Content Type</span>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{campaign.type}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Key info */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-wallet/5 rounded-xl">
                <DollarSign size={20} className="text-wallet" />
                <div>
                  <p className="text-xs text-gray-500">Budget Range</p>
                  <p className="font-heading font-bold text-gray-900 dark:text-white">{formatCurrency(campaign.budget.min)} – {formatCurrency(campaign.budget.max)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand/5 rounded-xl">
                <Calendar size={20} className="text-brand" />
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="font-heading font-bold text-gray-900 dark:text-white">{daysLeft} days left</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                <Users size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-gray-500">Applicants</p>
                  <p className="font-heading font-bold text-gray-900 dark:text-white">{campaign.applicants} applied · {campaign.hired} hired</p>
                </div>
              </div>
            </div>

            {/* Brand info */}
            {brand && (
              <div className="card p-5">
                <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Building2 size={15} /> About the Brand</h3>
                <div className="flex items-center gap-3 mb-3">
                  <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{brand.name}</p>
                    <p className="text-xs text-gray-500">{brand.industry}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">{brand.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>📍 {brand.location}</p>
                  <p>👥 {brand.size} employees</p>
                  <p>🎯 {brand.campaigns} campaigns total</p>
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleApply}
              disabled={campaign.status !== 'active'}
              className="btn btn-creator btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {campaign.status === 'active' ? 'Apply to Campaign' : 'Campaign Closed'}
              <ArrowRight size={16} />
            </button>
            {!isLoggedIn && (
              <p className="text-xs text-gray-400 text-center">You need an account to apply. <Link to="/signup" className="text-primary">Sign up free</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
