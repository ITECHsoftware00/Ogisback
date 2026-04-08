import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Search } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmptyState from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import SEO from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../lib/db';
import { normalizeOrder, formatCurrency } from '../../lib/normalize';

const statusTabs = ['all', 'active', 'in_review', 'delivered', 'completed', 'revision_requested'];

export default function CreatorOrders() {
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getOrders(user.id, 'creator')
      .then(data => setOrders(data.map(normalizeOrder)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = orders.filter(o => {
    const matchTab = tab === 'all' || o.status === tab;
    const matchSearch = !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.brandName?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

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
          {statusTabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-all ${tab === t ? 'bg-creator text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" description="Apply to campaigns to start receiving orders from brands." action={<Link to="/creator/campaigns" className="btn btn-creator btn-md">Browse Campaigns</Link>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const earnings = order.amount * 0.8;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/creator/orders/${order.id}`} className="card flex items-center gap-4 p-4 hover:shadow-card-hover transition-all group">
                  <img src={order.brandLogo || `https://i.pravatar.cc/48?u=${order.brand_id}`} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{order.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.brandName} · Due {order.due_date ? new Date(order.due_date).toLocaleDateString() : 'TBD'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(order.deliverables || []).slice(0, 2).map((d, di) => (
                        <span key={di} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{d}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-bold text-wallet text-base">{formatCurrency(earnings)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
