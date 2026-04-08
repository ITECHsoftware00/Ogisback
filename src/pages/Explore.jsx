import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import ContentCard from '../components/ContentCard';
import CreatorCard from '../components/CreatorCard';
import CampaignCard from '../components/CampaignCard';
import { getCreators, getCampaigns, getContentPosts } from '../lib/db';
import { normalizeCreator, normalizeCampaign } from '../lib/normalize';
import { useAuth } from '../context/AuthContext';

const tabs = ['All Content', 'Creators', 'Campaigns'];
const niches = ['All', 'Fashion', 'Beauty', 'Tech', 'Fitness', 'Food', 'Travel', 'Finance', 'Lifestyle'];

export default function Explore() {
  const [activeTab, setActiveTab] = useState('All Content');
  const [activeNiche, setActiveNiche] = useState('All');
  const [search, setSearch] = useState('');
  const [creators, setCreators] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [contentFeed, setContentFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isBrand, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getCreators({ limit: 50 }),
      getCampaigns({ status: 'active', limit: 50 }),
      getContentPosts({ limit: 60 }),
    ]).then(([c, camp, posts]) => {
      setCreators(c.map(normalizeCreator));
      setCampaigns(camp.map(normalizeCampaign));
      setContentFeed(posts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleHire = (item) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    toast.success(`Opening hire flow for ${item.creator || item.name}!`);
    navigate('/brand/discover');
  };
  const handleMessage = (item) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    toast.success('Opening conversation...');
    navigate('/brand/messages');
  };

  const filteredContent = contentFeed.filter(p => {
    const cap = p.caption || '';
    const matchNiche = activeNiche === 'All' || cap.toLowerCase().includes(activeNiche.toLowerCase()) || (p.tags || []).some(t => t.toLowerCase().includes(activeNiche.toLowerCase()));
    const matchSearch = !search || cap.toLowerCase().includes(search.toLowerCase());
    return matchNiche && matchSearch;
  });

  const filteredCreators = creators.filter(c => {
    const matchNiche = activeNiche === 'All' || c.niche.some(n => n.toLowerCase().includes(activeNiche.toLowerCase()));
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.username.toLowerCase().includes(search.toLowerCase());
    return matchNiche && matchSearch;
  });

  const filteredCampaigns = campaigns.filter(c => {
    const matchNiche = activeNiche === 'All' || c.niche.some(n => n.toLowerCase().includes(activeNiche.toLowerCase()));
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.brand.toLowerCase().includes(search.toLowerCase());
    return matchNiche && matchSearch && c.status === 'active';
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F]">
      <SEO
        title="Explore Creators & Campaigns"
        description="Browse thousands of content creators, influencers, and active brand campaigns. Discover talent across fashion, beauty, tech, fitness, travel, and more."
        url="/explore"
      />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">Explore Content</h1>
          <p className="text-gray-500">Discover creators, campaigns, and content from across the globe</p>
        </div>

        {/* Search */}
        <div className="relative max-w-lg mx-auto mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators, content, campaigns..."
            className="input pl-11 shadow-card"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 gap-0.5 shadow-card">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Niche filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <SlidersHorizontal size={14} className="text-gray-400 flex-shrink-0" />
            {niches.map(n => (
              <button
                key={n}
                onClick={() => setActiveNiche(n)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeNiche === n ? 'bg-primary text-white' : 'bg-white dark:bg-[#111118] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        )}
        {!loading && activeTab === 'All Content' && (
          <div>
            {filteredContent.length === 0 ? (
              <p className="text-center text-gray-500 py-16">No content found. Try a different search.</p>
            ) : (
              <div className="content-grid">
                {filteredContent.map(post => (
                  <ContentCard key={post.id} post={post} onHire={handleHire} onMessage={handleMessage} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'Creators' && (
          <div>
            {filteredCreators.length === 0 ? (
              <p className="text-center text-gray-500 py-16">No creators found.</p>
            ) : (
              <div className="creator-grid">
                {filteredCreators.map(c => (
                  <CreatorCard key={c.id} creator={c} onHire={handleHire} onMessage={handleMessage} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'Campaigns' && (
          <div>
            {filteredCampaigns.length === 0 ? (
              <p className="text-center text-gray-500 py-16">No active campaigns found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
