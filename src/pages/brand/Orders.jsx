import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getOrders, updateOrderStatus } from '../../lib/db';
import { releaseEscrow } from '../../lib/payments';
import { normalizeOrder, formatCurrency } from '../../lib/normalize';

const tabs = ['all', 'active', 'in_review', 'delivered', 'completed'];

export default function BrandOrders() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getOrders(user.id, 'brand')
      .then(data => setOrders(data.map(normalizeOrder)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = orders.filter(o => {
    const matchTab = tab === 'all' || o.status === tab;
    const matchSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.creatorName?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const handleApprove = async (orderId) => {
    try {
      await releaseEscrow(orderId);
      await updateOrderStatus(orderId, 'completed');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
      toast.success('Order approved! Payment released to creator.');
    } catch (err) { toast.error(err.message || 'Failed to approve'); }
  };

  const handleRevision = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'revision_requested');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'revision_requested' } : o));
      toast.success('Revision requested. Creator has been notified.');
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const activeCount = orders.filter(o => ['active', 'in_review', 'delivered'].includes(o.status)).length;

  return (
    <DashboardLayout>
      <SEO title="Orders" noindex={true} />
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <p className="page-subtitle">{orders.length} total orders · {activeCount} active</p>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="input pl-9 text-sm" />
        </div>
        <div className="flex gap-1 bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-all ${tab === t ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" description="Your orders with creators will appear here." action={<Link to="/brand/discover" className="btn btn-brand btn-md">Discover Creators</Link>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="card p-4 hover:shadow-card-hover transition-all">
                <div className="flex items-center gap-4">
                  <img src={order.creatorAvatar || `https://i.pravatar.cc/48?u=${order.creator_id}`} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{order.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.creatorName} · Due {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mr-2">
                    <p className="font-heading font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(order.amount)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {order.status === 'delivered' && (
                      <>
                        <button onClick={() => handleApprove(order.id)} className="btn btn-sm bg-green-500 text-white hover:bg-green-600 rounded-xl px-3 py-1.5 text-xs font-semibold">
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => handleRevision(order.id)} className="btn btn-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl px-3 py-1.5 text-xs font-semibold">
                          Revise
                        </button>
                      </>
                    )}
                    <Link to={`/brand/orders/${order.id}`} className="p-2 text-gray-400 hover:text-brand rounded-xl hover:bg-brand/10 transition-all">
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
