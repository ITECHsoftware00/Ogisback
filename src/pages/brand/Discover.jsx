import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Grid3X3, List } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreatorCard from '../../components/CreatorCard';
import ContentCard from '../../components/ContentCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { creators, contentFeed } from '../../data';

const niches = ['All', 'Fashion', 'Beauty', 'Tech', 'Fitness', 'Food', 'Travel', 'Finance', 'Lifestyle'];
const platforms = ['All Platforms', 'Instagram', 'TikTok', 'YouTube'];
const followerRanges = ['Any Size', '10K–50K', '50K–200K', '200K–1M', '1M+'];

export default function BrandDiscover() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('creators');
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState('All');
  const [platform, setPlatform] = useState('All Platforms');
  const [followerRange, setFollowerRange] = useState('Any Size');
  const [hireCreator, setHireCreator] = useState(null);
  const [hireNote, setHireNote] = useState('');
  const [budget, setBudget] = useState('');
  const [hiring, setHiring] = useState(false);

  const filteredCreators = creators.filter(c => {
    const matchNiche = niche === 'All' || c.niche.some(n => n === niche);
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.username.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platform === 'All Platforms' ||
      (platform === 'Instagram' && c.followers.instagram > 0) ||
      (platform === 'YouTube' && c.followers.youtube > 0) ||
      (platform === 'TikTok' && c.followers.tiktok > 0);
    return matchNiche && matchSearch && matchPlatform;
  });

  const handleHire = async () => {
    if (!budget) { toast.error('Please enter a budget'); return; }
    setHiring(true);
    await new Promise(r => setTimeout(r, 1500));
    setHiring(false);
    setHireCreator(null);
    toast.success(`Proposal sent to ${hireCreator?.name}! Funds will be held in escrow once accepted.`);
  };

  const handleMessage = (creator) => {
    toast.success(`Opening conversation with ${creator.name || creator.creator}`);
    navigate('/brand/messages');
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Discover Creators</h1>
        <p className="page-subtitle">Browse {creators.length} verified creators across all niches</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {['creators', 'content'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            {t === 'creators' ? 'Creators' : 'Content Feed'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators..." className="input pl-10" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
          {niches.map(n => (
            <button key={n} onClick={() => setNiche(n)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${niche === n ? 'bg-brand text-white' : 'bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand hover:text-brand'}`}>{n}</button>
          ))}
        </div>
      </div>

      {tab === 'creators' ? (
        filteredCreators.length === 0 ? (
          <EmptyState icon={Search} title="No creators found" description="Try adjusting your filters." />
        ) : (
          <div className="creator-grid">
            {filteredCreators.map(c => (
              <CreatorCard
                key={c.id}
                creator={c}
                onHire={() => setHireCreator(c)}
                onMessage={() => handleMessage(c)}
                linkPrefix="/brand/discover"
              />
            ))}
          </div>
        )
      ) : (
        <div className="content-grid">
          {contentFeed.map(p => (
            <ContentCard key={p.id} post={p} onHire={() => setHireCreator(creators.find(c => c.id === p.creatorId))} onMessage={() => handleMessage(p)} />
          ))}
        </div>
      )}

      {/* Hire modal */}
      <Modal isOpen={!!hireCreator} onClose={() => setHireCreator(null)} title={`Hire ${hireCreator?.name}`} size="md">
        {hireCreator && (
          <div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
              <img src={hireCreator.avatar} alt="" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{hireCreator.name}</p>
                <p className="text-xs text-gray-500">{hireCreator.niche?.join(', ')}</p>
                <p className="text-xs text-brand mt-0.5">Starting from ${hireCreator.rates?.post?.toLocaleString()}</p>
              </div>
            </div>
            <div className="rounded-xl bg-wallet/5 border border-wallet/20 p-3 mb-4 text-xs text-gray-600 dark:text-gray-400">
              💰 Your payment will be held in <strong>escrow</strong> until you approve the delivered content. 100% protected.
            </div>
            <div className="form-group mb-3">
              <label className="label">Budget (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder={hireCreator.rates?.post?.toString()} className="input pl-8" />
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="label">Campaign Brief</label>
              <textarea value={hireNote} onChange={e => setHireNote(e.target.value)} placeholder="Describe the deliverables, tone, key messages, and any brand guidelines..." rows={4} className="input resize-none text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setHireCreator(null)} className="btn btn-outline btn-md flex-1">Cancel</button>
              <button onClick={handleHire} disabled={hiring} className="btn btn-brand btn-md flex-1 disabled:opacity-70">
                {hiring ? 'Sending...' : '💰 Send Proposal'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
