import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CreatorCard from '../../components/CreatorCard';
import ContentCard from '../../components/ContentCard';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getCreators, getContentPosts, createOrder, getOrCreateConversation } from '../../lib/db';
import { createEscrow, getFeeRate } from '../../lib/payments';
import { normalizeCreator, normalizePost, formatCurrency } from '../../lib/normalize';

const NICHES = ['All', 'Fashion', 'Beauty', 'Tech', 'Fitness', 'Food', 'Travel', 'Finance', 'Lifestyle'];
const PLATFORMS = ['All Platforms', 'Instagram', 'TikTok', 'YouTube'];

export default function BrandDiscover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('creators');
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState('All');
  const [platform, setPlatform] = useState('All Platforms');
  const [creators, setCreators] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hireCreator, setHireCreator] = useState(null);
  const [hireNote, setHireNote] = useState('');
  const [budget, setBudget] = useState('');
  const [hiring, setHiring] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCreators({ limit: 60 }), getContentPosts({ limit: 30 })])
      .then(([c, posts]) => { setCreators(c.map(normalizeCreator)); setContent(posts.map(normalizePost)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCreators = creators.filter(c => {
    const matchNiche = niche === 'All' || (c.niche || []).includes(niche);
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.username?.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platform === 'All Platforms' ||
      (platform === 'Instagram' && c.followers?.instagram > 0) ||
      (platform === 'YouTube' && c.followers?.youtube > 0) ||
      (platform === 'TikTok' && c.followers?.tiktok > 0);
    return matchNiche && matchSearch && matchPlatform;
  });

  const handleHire = async () => {
    const amount = parseFloat(budget);
    if (!amount || amount <= 0) { toast.error('Enter a valid budget'); return; }
    if (!user?.id) return;
    if ((user.walletBalance || 0) < amount) {
      toast.error('Insufficient wallet balance — add funds first');
      navigate('/brand/add-funds');
      return;
    }
    setHiring(true);
    try {
      const order = await createOrder({
        creator_id: hireCreator.id,
        brand_id: user.id,
        title: `Direct hire — ${hireCreator.name}`,
        amount,
        deliverables: hireNote ? [hireNote] : [],
        due_date: null,
        status: 'active',
      });
      await createEscrow({ orderId: order.id, brandId: user.id, creatorId: hireCreator.id, amount, feeRate: getFeeRate(user.plan) });
      toast.success(`Proposal sent to ${hireCreator.name}! Funds are held in escrow.`);
      setHireCreator(null); setBudget(''); setHireNote('');
      navigate('/brand/orders');
    } catch (err) {
      toast.error(err.message || 'Failed to create order');
    } finally {
      setHiring(false);
    }
  };

  const handleMessage = async (creator) => {
    if (!user?.id) { navigate('/login'); return; }
    try {
      const conv = await getOrCreateConversation(creator.id, user.id);
      navigate(`/brand/messages/${conv.id}`);
    } catch { navigate('/brand/messages'); }
  };

  return (
    <DashboardLayout>
      <SEO title="Discover Creators" noindex={true} />
      <div className="page-header">
        <h1 className="page-title">Discover Creators</h1>
        <p className="page-subtitle">{creators.length} verified creators across all niches</p>
      </div>

      <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {['creators', 'content'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            {t === 'creators' ? 'Creators' : 'Content Feed'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search creators..." className="input pl-10" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
          {NICHES.map(n => (
            <button key={n} onClick={() => setNiche(n)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${niche === n ? 'bg-brand text-white' : 'bg-white dark:bg-[#111118] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand hover:text-brand'}`}>{n}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${platform === p ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading creators...</div>
      ) : tab === 'creators' ? (
        filteredCreators.length === 0 ? (
          <EmptyState icon={Search} title="No creators found" description="Try adjusting your filters." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCreators.map((creator, i) => (
              <motion.div key={creator.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <CreatorCard creator={creator} onHire={() => setHireCreator(creator)} onMessage={() => handleMessage(creator)} />
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ContentCard post={post} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={!!hireCreator} onClose={() => { setHireCreator(null); setBudget(''); setHireNote(''); }} title={`Hire ${hireCreator?.name}`}>
        <div className="space-y-4">
          <div className="p-3 bg-wallet/5 border border-wallet/20 rounded-xl text-xs text-gray-600 dark:text-gray-400">
            💰 Payment held in escrow — released only when you approve the content.
            {user?.walletBalance !== undefined && <span className="ml-1 font-medium text-wallet">Balance: {formatCurrency(user.walletBalance)}</span>}
          </div>
          <div className="form-group">
            <label className="label">Budget (USD) *</label>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder={hireCreator?.rate_post?.toString() || '500'} className="input pl-8" /></div>
          </div>
          <div className="form-group">
            <label className="label">Campaign Brief</label>
            <textarea value={hireNote} onChange={e => setHireNote(e.target.value)} placeholder="Describe the deliverables, tone, and brand guidelines..." rows={4} className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setHireCreator(null)} className="btn btn-outline btn-md flex-1" disabled={hiring}>Cancel</button>
            <button onClick={handleHire} disabled={hiring} className="btn btn-brand btn-md flex-1 disabled:opacity-60">
              {hiring ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span> : 'Send Proposal'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
