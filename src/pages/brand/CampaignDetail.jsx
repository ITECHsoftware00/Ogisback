import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { NicheBadge } from '../../components/ui/Badge';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getCampaignById, getCampaignApplications, updateApplicationStatus, createOrder, getOrCreateConversation } from '../../lib/db';
import { createEscrow, getFeeRate } from '../../lib/payments';
import { normalizeCampaign, normalizeCreator, formatCurrency } from '../../lib/normalize';

export default function BrandCampaignDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([getCampaignById(id), getCampaignApplications(id)])
      .then(([c, apps]) => { setCampaign(normalizeCampaign(c)); setApplications(apps); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = async (app) => {
    if (!user?.id) return;
    try {
      await updateApplicationStatus(app.id, 'accepted');
      const order = await createOrder({
        creator_id: app.creator_id,
        brand_id: user.id,
        title: campaign.title,
        amount: app.proposed_rate || campaign.budget?.max || 0,
        deliverables: campaign.deliverables || [],
        due_date: campaign.deadline || null,
        status: 'active',
      });
      await createEscrow({ orderId: order.id, brandId: user.id, creatorId: app.creator_id, amount: order.amount, feeRate: getFeeRate(user?.plan) });
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'accepted' } : a));
      toast.success(`${app.creator_profiles?.name} hired! Funds held in escrow.`);
      navigate('/brand/orders');
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleReject = async (appId) => {
    try {
      await updateApplicationStatus(appId, 'rejected');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
      toast.success('Application rejected.');
    } catch { toast.error('Failed to reject'); }
  };

  const handleMessage = async (creatorId) => {
    try {
      const conv = await getOrCreateConversation(creatorId, user.id);
      navigate(`/brand/messages/${conv.id}`);
    } catch { navigate('/brand/messages'); }
  };

  if (loading) return <DashboardLayout><div className="text-center py-24 text-gray-400">Loading...</div></DashboardLayout>;
  if (!campaign) return <DashboardLayout><div className="text-center py-24"><p className="font-heading font-bold text-xl mb-4">Campaign not found</p><Link to="/brand/campaigns" className="btn btn-brand btn-md">Back</Link></div></DashboardLayout>;

  const daysLeft = campaign.deadline ? Math.max(0, Math.ceil((new Date(campaign.deadline) - Date.now()) / 86400000)) : null;
  const pendingApps = applications.filter(a => a.status === 'pending');

  return (
    <DashboardLayout>
      <SEO title="Campaign Details" noindex={true} />
      <Link to="/brand/campaigns" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to campaigns
      </Link>

      <div className="relative h-48 rounded-3xl overflow-hidden mb-6 bg-gradient-to-r from-brand/80 to-primary/80">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <h1 className="text-white font-heading font-bold text-2xl">{campaign.title}</h1>
          <p className="text-white/70 text-sm mt-0.5">{campaign.content_type || 'Campaign'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Budget', value: campaign.budget?.min && campaign.budget?.max ? `${formatCurrency(campaign.budget.min)}–${formatCurrency(campaign.budget.max)}` : '—', icon: DollarSign, color: 'text-wallet' },
          ...(daysLeft !== null ? [{ label: 'Days Left', value: `${daysLeft}d`, icon: Clock, color: 'text-brand' }] : []),
          { label: 'Applicants', value: applications.length, icon: Users, color: 'text-primary' },
          { label: 'Pending Review', value: pendingApps.length, icon: CheckCircle, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div><p className="font-heading font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 w-fit mb-6">
        {['overview', 'applicants'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            {t} {t === 'applicants' && `(${applications.length})`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="section-title">Brief</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{campaign.description || '—'}</p>
            <div className="flex flex-wrap gap-1.5">{(campaign.niche || []).map(n => <NicheBadge key={n} niche={n} />)}</div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">Deliverables</h2>
            {(campaign.deliverables || []).length > 0 ? (
              <ul className="space-y-2">{campaign.deliverables.map((d, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 p-2.5 bg-brand/5 rounded-xl">
                  <CheckCircle size={14} className="text-brand" />{d}
                </li>
              ))}</ul>
            ) : <p className="text-sm text-gray-400">No deliverables specified.</p>}
          </div>
        </div>
      )}

      {tab === 'applicants' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No applicants yet. Share your campaign to attract creators.</div>
          ) : (
            applications.map(app => {
              const creator = app.creator_profiles;
              return (
                <div key={app.id} className="card p-4 flex items-center gap-4">
                  <img src={creator?.avatar_url || `https://i.pravatar.cc/48?u=${app.creator_id}`} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{creator?.name || 'Creator'}</p>
                    <p className="text-xs text-gray-500">@{creator?.username} · {creator?.rating ? `${creator.rating}★` : ''}</p>
                    {app.pitch && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{app.pitch}</p>}
                  </div>
                  {app.proposed_rate && (
                    <div className="text-right flex-shrink-0 mr-3">
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(app.proposed_rate)}</p>
                      <p className="text-xs text-gray-400">proposed rate</p>
                    </div>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    {app.status === 'pending' ? (
                      <>
                        <button onClick={() => handleMessage(app.creator_id)} className="btn btn-outline btn-sm text-xs">Message</button>
                        <button onClick={() => handleReject(app.id)} className="btn btn-outline btn-sm text-xs text-red-500 border-red-200 hover:bg-red-50">Reject</button>
                        <button onClick={() => handleAccept(app)} className="btn btn-brand btn-sm text-xs">Hire</button>
                      </>
                    ) : (
                      <span className={`badge ${app.status === 'accepted' ? 'badge-success' : 'badge-danger'} capitalize`}>{app.status}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
