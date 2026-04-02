import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Shield, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/Badge';
import { getOrderById, orders, formatCurrency } from '../../data';

export default function BrandOrderDetail() {
  const { id } = useParams();
  const order = getOrderById(id) || orders[0];
  const [approving, setApproving] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    await new Promise(r => setTimeout(r, 1500));
    setApproving(false);
    toast.success(`🎉 Approved! ${formatCurrency(order.creatorEarnings)} released to ${order.creator}'s wallet.`);
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) { toast.error('Please describe the revision needed'); return; }
    toast.success('Revision requested. Creator has been notified.');
    setShowRevisionForm(false);
    setRevisionNote('');
  };

  return (
    <DashboardLayout>
      <Link to="/brand/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <img src={order.creatorAvatar} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              <div className="flex-1">
                <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1">{order.title}</h1>
                <p className="text-gray-500 text-sm">Creator: <span className="font-medium text-gray-800 dark:text-gray-200">{order.creator}</span></p>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-gray-400">Order #{order.id}</span>
                  <span className="text-xs text-gray-400">Due: {new Date(order.deliveryDeadline).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</p>
                <p className="text-xs text-gray-400">total budget</p>
              </div>
            </div>
          </div>

          {/* Deliverables */}
          <div className="card p-6">
            <h2 className="section-title">Deliverables</h2>
            <ul className="space-y-2">
              {order.deliverables.map((d, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <CheckCircle size={14} className="text-brand flex-shrink-0" /> {d}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-3"><Clock size={12} />Delivery deadline: {new Date(order.deliveryDeadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Approve / Revision actions */}
          {order.status === 'delivered' && (
            <div className="card p-6 border-2 border-brand/20">
              <h2 className="section-title flex items-center gap-2">🎉 Content Delivered — Review Required</h2>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm text-green-700 dark:text-green-300 mb-4">
                <strong>{order.creator}</strong> has submitted their deliverables. Review and approve to release payment.
              </div>
              {!showRevisionForm ? (
                <div className="flex gap-3">
                  <button onClick={() => setShowRevisionForm(true)} className="btn btn-outline border-orange-200 text-orange-700 hover:bg-orange-50 btn-md flex-1 dark:border-orange-700 dark:text-orange-400">
                    <XCircle size={16} /> Request Revision ({order.maxRevisions - order.revisions} left)
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
                    <button onClick={handleRevision} className="btn bg-orange-500 text-white hover:bg-orange-600 btn-md flex-1">Send Revision Request</button>
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
                  <p className="text-sm opacity-80 mt-1">You requested a revision. Awaiting {order.creator}'s resubmission.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-wallet" />Escrow Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">You paid</span><span className="font-semibold">{formatCurrency(order.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform fee (20%)</span><span className="text-gray-900 dark:text-white">{formatCurrency(order.commission)}</span></div>
              <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2">
                <span className="text-gray-500">Creator receives</span><span className="font-bold text-green-600">{formatCurrency(order.creatorEarnings)}</span>
              </div>
              <div className={`text-center text-xs py-1.5 rounded-full font-medium mt-2 ${order.paymentStatus === 'released' ? 'bg-green-100 text-green-700' : 'bg-wallet/10 text-wallet'}`}>
                {order.paymentStatus === 'in_escrow' ? '🔒 Held Securely in Escrow' : '✅ Payment Released'}
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-2">Revisions</h3>
            <p className="text-sm text-gray-500 mb-2">Used {order.revisions} of {order.maxRevisions}</p>
            <div className="flex gap-1">{[...Array(order.maxRevisions)].map((_, i) => <div key={i} className={`flex-1 h-2 rounded-full ${i < order.revisions ? 'bg-orange-400' : 'bg-gray-100 dark:bg-gray-700'}`} />)}</div>
          </div>
          <Link to="/brand/messages" className="btn btn-outline btn-sm w-full"><MessageSquare size={14} />Message {order.creator}</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
