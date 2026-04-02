import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, CheckCircle, MessageCircle, Zap, Clock, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { NicheBadge } from '../../components/ui/Badge';
import ContentCard from '../../components/ContentCard';
import { creators, contentFeed, formatNumber } from '../../data';

export default function BrandCreatorView() {
  const { username } = useParams();
  const navigate = useNavigate();
  const creator = creators.find(c => c.username === username) || creators[0];
  const posts = contentFeed.filter(p => p.creatorId === creator.id);
  const [hireModal, setHireModal] = useState(false);
  const [budget, setBudget] = useState('');
  const [brief, setBrief] = useState('');
  const [hiring, setHiring] = useState(false);

  const handleHire = async () => {
    if (!budget) { toast.error('Enter a budget'); return; }
    setHiring(true);
    await new Promise(r => setTimeout(r, 1500));
    setHiring(false);
    setHireModal(false);
    toast.success('Proposal sent! Waiting for creator to accept.');
    navigate('/brand/orders');
  };

  return (
    <DashboardLayout>
      <Link to="/brand/discover" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to discover
      </Link>

      {/* Cover */}
      <div className="relative h-48 rounded-3xl overflow-hidden mb-6">
        <img src={creator.cover} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Profile header */}
          <div className="flex items-start gap-4 mb-6 -mt-12">
            <img src={creator.avatar} alt="" className="w-20 h-20 rounded-2xl border-4 border-white dark:border-[#0A0A0F] object-cover shadow-lg" />
            <div className="pt-12 flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {creator.name}
                    {creator.verified && <CheckCircle size={16} className="text-primary" />}
                  </h1>
                  <p className="text-gray-500 text-sm">@{creator.username}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={12} />{creator.location}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />Replies in {creator.responseTime}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/brand/messages')} className="btn btn-outline btn-sm"><MessageCircle size={14} />Message</button>
                  <button onClick={() => setHireModal(true)} className="btn btn-brand btn-sm"><Zap size={14} />Hire</button>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{creator.bio}</p>
            <div className="flex flex-wrap gap-1.5">{creator.niche.map(n => <NicheBadge key={n} niche={n} />)}</div>
          </div>

          {/* Content grid */}
          <h2 className="section-title">Content ({posts.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {posts.map(p => <ContentCard key={p.id} post={p} onHire={() => setHireModal(true)} onMessage={() => navigate('/brand/messages')} />)}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500 flex items-center gap-2"><Users size={13} />Followers</span><span className="font-bold text-sm text-gray-900 dark:text-white">{formatNumber(creator.totalFollowers)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500 flex items-center gap-2"><TrendingUp size={13} />Engagement</span><span className="font-bold text-sm text-gray-900 dark:text-white">{creator.engagementRate}%</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500 flex items-center gap-2"><Star size={13} />Rating</span><span className="font-bold text-sm text-gray-900 dark:text-white">{creator.rating} ({creator.reviewCount})</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Orders done</span><span className="font-bold text-sm text-green-600">{creator.completedOrders}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">On-time</span><span className="font-bold text-sm text-green-600">{creator.onTime}%</span></div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">Rates (USD)</h3>
            {Object.entries(creator.rates).map(([t, p]) => (
              <div key={t} className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0 text-sm">
                <span className="text-gray-500 capitalize">{t}</span>
                <span className="font-bold text-gray-900 dark:text-white">${p.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setHireModal(true)} className="btn btn-brand btn-lg w-full"><Zap size={16} />Hire {creator.name.split(' ')[0]}</button>
        </div>
      </div>

      <Modal isOpen={hireModal} onClose={() => setHireModal(false)} title={`Hire ${creator.name}`}>
        <div className="space-y-4">
          <div className="p-3 bg-wallet/5 border border-wallet/20 rounded-xl text-xs text-gray-600 dark:text-gray-400">
            💰 Your full payment will be held in secure escrow until you approve the delivered content.
          </div>
          <div className="form-group">
            <label className="label">Budget (USD) *</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder={creator.rates.post.toString()} className="input pl-8" /></div>
          </div>
          <div className="form-group">
            <label className="label">Campaign Brief</label>
            <textarea value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe the deliverables, tone, and brand guidelines..." rows={4} className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setHireModal(false)} className="btn btn-outline btn-md flex-1">Cancel</button>
            <button onClick={handleHire} disabled={hiring} className="btn btn-brand btn-md flex-1">{hiring ? 'Sending...' : 'Send Proposal'}</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
