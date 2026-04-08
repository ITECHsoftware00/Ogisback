import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookMarked, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import CreatorCard from '../../components/CreatorCard';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getSavedCreators, unsaveCreator, getOrCreateConversation, createOrder } from '../../lib/db';
import { createEscrow, getFeeRate } from '../../lib/payments';
import { normalizeCreator } from '../../lib/normalize';
import { useNavigate } from 'react-router-dom';

export default function BrandSaved() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getSavedCreators(user.id)
      .then(data => setSaved(data.map(normalizeCreator)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = saved.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));

  const handleRemove = async (creatorId) => {
    try {
      await unsaveCreator(user.id, creatorId);
      setSaved(s => s.filter(c => c.id !== creatorId));
      toast.success('Removed from saved creators');
    } catch { toast.error('Failed to remove'); }
  };

  const handleMessage = async (creator) => {
    try {
      const conv = await getOrCreateConversation(creator.id, user.id);
      navigate(`/brand/messages/${conv.id}`);
    } catch { navigate('/brand/messages'); }
  };

  return (
    <DashboardLayout>
      <SEO title="Saved Creators" noindex={true} />
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><BookMarked size={22} className="text-brand" />Saved Creators</h1>
          <p className="page-subtitle">{saved.length} creators in your shortlist</p>
        </div>
        <Link to="/brand/discover" className="btn btn-brand btn-md">Browse More Creators</Link>
      </div>

      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saved creators..." className="input pl-10" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading saved creators...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookMarked} title={saved.length === 0 ? 'No saved creators' : 'No results'} description={saved.length === 0 ? 'Save creators you like while browsing to build your shortlist.' : 'Try adjusting your search.'} action={<Link to="/brand/discover" className="btn btn-brand btn-md">Discover Creators</Link>} />
      ) : (
        <div className="creator-grid">
          {filtered.map((creator, i) => (
            <motion.div key={creator.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="relative group">
              <CreatorCard
                creator={creator}
                onHire={() => navigate(`/brand/discover/${creator.username}`)}
                onMessage={() => handleMessage(creator)}
                linkPrefix="/brand/discover"
              />
              <button
                onClick={() => handleRemove(creator.id)}
                className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
