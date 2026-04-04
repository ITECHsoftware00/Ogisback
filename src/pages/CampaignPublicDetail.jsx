import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, DollarSign, CheckCircle, Building2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { NicheBadge } from '../components/ui/Badge';
import { getCampaignById } from '../lib/db';
import { formatCurrency } from '../lib/normalize';
import { useAuth } from '../context/AuthContext';
import SEO, { campaignSchema } from '../components/SEO';

function adaptCampaign(row) {
  if (!row) return null;
  const bp = row.brand_profiles || {};
  return {
    ...row,
    brand: bp.name || 'Unknown Brand',
    brandLogo: bp.logo_url || `https://i.pravatar.cc/40?u=${row.brand_id}`,
    brandIndustry: bp.industry || null,
    brandWebsite: bp.website || null,
    brandDescription: bp.description || null,
    image: row.image_url || null,
    type: row.content_type || '',
    niche: row.niche || [],
    deliverables: row.deliverables || [],
    platforms: row.platforms || [],
    budget: { min: row.budget_min || 0, max: row.budget_max || 0 },
    applicants: row.applicant_count || 0,
    hired: row.hired_count || 0,
    requirements: {
      minFollowers: row.min_followers || 0,
      platforms: row.platforms || [],
    },
  };
}

export default function CampaignPublicDetail() {
  const { id } = useParams();
  const { isLoggedIn, isCreator } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCampaignById(id)
      .then(data => setCampaign(adaptCampaign(data)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!isCreator) { toast.error('Only creators can apply to campaigns'); return; }
    navigate('/creator/campaigns');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-gray-400">Loading campaign...</div>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
        <SEO title="Campaign Not Found" noindex={true} />
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <p className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">Campaign not found</p>
          <p className="text-sm mb-6">This campaign may have been removed or closed.</p>
          <Link to="/explore" className="btn btn-creator btn-md">Browse Campaigns</Link>
        </div>
      </div>
    );
  }

  const daysLeft = campaign.deadline
    ? Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000))
    : null;

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
        <div className="relative h-56 rounded-3xl overflow-hidden mb-6 bg-gray-100 dark:bg-gray-800">
          {campaign.image && <img src={campaign.image} alt="" className="w-full h-full object-cover" />}
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
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{campaign.description || 'No description provided.'}</p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {campaign.niche.map(n => <NicheBadge key={n} niche={n} />)}
              </div>
            </div>

            {/* Deliverables */}
            {campaign.deliverables.length > 0 && (
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
            )}

            {/* Requirements */}
            <div className="card p-6">
              <h2 className="section-title">Creator Requirements</h2>
              <div className="space-y-3">
                {campaign.requirements.minFollowers > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-sm text-gray-500">Minimum Followers</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{campaign.requirements.minFollowers.toLocaleString()}+</span>
                  </div>
                )}
                {campaign.requirements.platforms.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-sm text-gray-500">Platforms</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white capitalize">{campaign.requirements.platforms.join(', ')}</span>
                  </div>
                )}
                {campaign.type && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">Content Type</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{campaign.type}</span>
                  </div>
                )}
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
              {daysLeft !== null && (
                <div className="flex items-center gap-3 p-3 bg-brand/5 rounded-xl">
                  <Calendar size={20} className="text-brand" />
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="font-heading font-bold text-gray-900 dark:text-white">{daysLeft} days left</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl">
                <Users size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-gray-500">Applicants</p>
                  <p className="font-heading font-bold text-gray-900 dark:text-white">{campaign.applicants} applied · {campaign.hired} hired</p>
                </div>
              </div>
            </div>

            {/* Brand info */}
            <div className="card p-5">
              <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Building2 size={15} /> About the Brand</h3>
              <div className="flex items-center gap-3 mb-3">
                <img src={campaign.brandLogo} alt={campaign.brand} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{campaign.brand}</p>
                  {campaign.brandIndustry && <p className="text-xs text-gray-500">{campaign.brandIndustry}</p>}
                </div>
              </div>
              {campaign.brandDescription && (
                <p className="text-xs text-gray-500 mb-3">{campaign.brandDescription}</p>
              )}
            </div>

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
