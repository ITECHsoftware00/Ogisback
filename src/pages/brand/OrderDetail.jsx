import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Shield, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/Badge';
import SEO from '../../components/SEO';
import { getOrderById, updateOrderStatus } from '../../lib/db';
import { releaseEscrow, getEscrow } from '../../lib/payments';
import { normalizeOrder, formatCurrency } from '../../lib/normalize';

export default function BrandOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [submittingRevision, setSubmittingRevision] = useState(false);

  useEffect(() => {
    Promise.all([getOrderById(id), getEscrow(id)])
      .then(([o, e]) => { setOrder(normalizeOrder(o)); setEscrow(e); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await releaseEscrow(id);
      await updateOrderStatus(id, 'completed');
      setOrder(prev => ({ ...prev, status: 'completed' }));
      setEscrow(prev => prev ? { ...prev, status: 'released' } : prev);
      toast.success(`Payment released to ${order.creatorName}'s wallet.`);
    } catch (err) { toast.error(err.message || 'Failed'); } finally { setApproving(false); }
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) { toast.error('Please describe the revision needed'); return; }
    setSubmittingRevision(true);
    try {
      await updateOrderStatus(id, 'revision_requested', revisionNote);
      setOrder(prev => ({ ...prev, status: 'revision_requested' }));
      toast.success('Revision requested. Creator has been notified.');
      setShowRevisionForm(false); setRevisionNote('');
    } catch (err) { toast.error(err.message || 'Failed'); } finally { setSubmittingRevision(false); }
  };

  if (loading) return <DashboardLayout><div className="text-center py-24 text-gray-400">Loading...</div></DashboardLayout>;
  if (!order) return <DashboardLayout><div className="text-center py-24"><p className="font-heading font-bold text-xl mb-4">Order not found</p><Link to="/brand/orders" className="btn btn-brand btn-md">Back</Link></div></DashboardLayout>;

  const commission = escrow?.platform_fee ?? order.amount * 0.2;
  const creatorEarnings = escrow?.creator_payout ?? order.amount * 0.8;
  const paymentStatus = escrow?.status ?? 'held';

  return (
    <DashboardLayout>
      <SEO title="Order Details" noindex={true} />
      <Link to="/brand/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <img src={order.creatorAvatar || `https://i.pravatar.cc/56?u=${order.creator_id}`} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              <div className="flex-1">
                <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1">{order.title}</h1>
                <p className="text-gray-500 text-sm">Creator: <span className="font-medium text-gray-800 dark:text-gray-200">{order.creatorName}</span></p>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-gray-400">Order #{order.id.slice(0, 8)}</span>
                  {order.due_date && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} />Due {new Date(order.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</p>
                <p className="text-xs text-gray-400">total budget</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="section-title">Deliverables</h2>
            {(order.deliverables || []).length > 0 ? (
              <ul className="space-y-2">
                {order.deliverables.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <CheckCircle size={14} className="text-brand flex-shrink-0" /> {d}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-400">No deliverables specified.</p>}
            {order.due_date && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-3">
                <Clock size={12} />Delivery deadline: {new Date(order.due_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {order.delivery_note && (
            <div className="card p-6">
              <h2 className="section-title">Delivery Note from Creator</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{order.delivery_note}</p>
            </div>
          )}

          {order.status === 'delivered' && (
            <div className="card p-6 border-2 border-brand/20">
              <h2 className="section-title">Content Delivered — Review Required</h2>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm text-green-700 dark:text-green-300 mb-4">
                <strong>{order.creatorName}</strong> has submitted their deliverables. Review and approve to release payment.
              </div>
              {!showRevisionForm ? (
                <div className="flex gap-3">
                  <button onClick={() => setShowRevisionForm(true)} className="btn btn-outline border-orange-200 text-orange-700 hover:bg-orange-50 btn-md flex-1 dark:border-orange-700 dark:text-orange-400">
                    <XCircle size={16} /> Request Revision
                  </button>
                  <button onClick={handleApprove} disabled={approving} className="btn bg-green-500 hover:bg-green-600 text-white btn-md flex-1 disabled:opacity-70">
                    {approving ? 'Releasing payment...' : <><CheckCircle size={16} /> Approve & Pay</>}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="form-group mb-3">
                    <label className="label">Describe the revision needed</label>
                    <textarea value={revisionNote} onChange={e => setRevisionNote(e.target.value)} placeholder="Be specific about what needs to be changed..." rows={4} className="input resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowRevisionForm(false)} className="btn btn-outline btn-md flex-1">Cancel</button>
                    <button onClick={handleRevision} disabled={submittingRevision} className="btn bg-orange-500 text-white hover:bg-orange-600 btn-md flex-1 disabled:opacity-70">
                      {submittingRevision ? 'Sending...' : 'Send Revision Request'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {order.status === 'revision_requested' && (
            <div className="card p-5 border-l-4 border-orange-400">
              <div className="flex items-start gap-3 text-orange-700 dark:text-orange-300">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Revision Requested</p>
                  <p className="text-sm opacity-80 mt-1">You requested a revision. Awaiting {order.creatorName}'s resubmission.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-wallet" />Escrow Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">You paid</span><span className="font-semibold">{formatCurrency(order.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform fee</span><span className="text-gray-900 dark:text-white">{formatCurrency(commission)}</span></div>
              <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2">
                <span className="text-gray-500">Creator receives</span><span className="font-bold text-green-600">{formatCurrency(creatorEarnings)}</span>
              </div>
              <div className={`text-center text-xs py-1.5 rounded-full font-medium mt-2 ${paymentStatus === 'released' ? 'bg-green-100 text-green-700' : 'bg-wallet/10 text-wallet'}`}>
                {paymentStatus === 'held' ? '🔒 Held Securely in Escrow' : '✅ Payment Released'}
              </div>
            </div>
          </div>
          <Link to="/brand/messages" className="btn btn-outline btn-sm w-full"><MessageSquare size={14} />Message {order.creatorName}</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
