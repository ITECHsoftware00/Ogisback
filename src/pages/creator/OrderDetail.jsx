import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Upload, CheckCircle, Clock, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/ui/Badge';
import { getOrderById, orders, formatCurrency } from '../../data';

export default function CreatorOrderDetail() {
  const { id } = useParams();
  const order = getOrderById(id) || orders[0];
  const [delivering, setDelivering] = useState(false);
  const [note, setNote] = useState('');

  const handleDeliver = async () => {
    if (!note.trim()) { toast.error('Please add a delivery note'); return; }
    setDelivering(true);
    await new Promise(r => setTimeout(r, 1200));
    setDelivering(false);
    toast.success('Delivery submitted! Awaiting brand approval.');
  };

  const statusSteps = [
    { id: 'pending', label: 'Order Placed' },
    { id: 'active', label: 'In Progress' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'in_review', label: 'In Review' },
    { id: 'completed', label: 'Completed' },
  ];
  const stepIndex = statusSteps.findIndex(s => s.id === order.status);

  return (
    <DashboardLayout>
      <Link to="/creator/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-creator text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to orders
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <img src={order.brandLogo} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              <div className="flex-1">
                <h1 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1">{order.title}</h1>
                <p className="text-gray-500 text-sm">from {order.brand}</p>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-gray-400">Order #{order.id}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-heading font-bold text-wallet">{formatCurrency(order.creatorEarnings)}</p>
                <p className="text-xs text-gray-400">your earnings (80%)</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card p-6">
            <h2 className="section-title">Order Progress</h2>
            <div className="flex items-center gap-0">
              {statusSteps.map((step, i) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= stepIndex ? 'bg-creator text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      {i < stepIndex ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 text-center w-16">{step.label}</p>
                  </div>
                  {i < statusSteps.length - 1 && <div className={`flex-1 h-0.5 mb-5 ${i < stepIndex ? 'bg-creator' : 'bg-gray-100 dark:bg-gray-800'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div className="card p-6">
            <h2 className="section-title">Deliverables</h2>
            <ul className="space-y-2 mb-4">
              {order.deliverables.map((d, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <CheckCircle size={15} className="text-creator" /> {d}
                </li>
              ))}
            </ul>
            <div className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} />Due: {new Date(order.deliveryDeadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>

          {/* Delivery form */}
          {['active', 'revision_requested'].includes(order.status) && (
            <div className="card p-6 border-2 border-creator/20">
              <h2 className="section-title">Submit Delivery</h2>
              {order.status === 'revision_requested' && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl mb-4 text-orange-700 dark:text-orange-300">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">Brand requested a revision. Please review their feedback and resubmit.</p>
                </div>
              )}
              <div className="form-group mb-4">
                <label className="label">Delivery Note</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Describe what you've delivered, any notes for the brand..." rows={4} className="input resize-none" />
              </div>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center mb-4 cursor-pointer hover:border-creator/40 transition-colors">
                <Upload size={20} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Attach files (optional)</p>
              </div>
              <button onClick={handleDeliver} disabled={delivering} className="btn btn-creator btn-lg w-full disabled:opacity-70">
                {delivering ? 'Submitting...' : <><Upload size={16} /> Submit Delivery</>}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Payment info */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-wallet" />Payment Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform fee (20%)</span>
                <span className="font-semibold text-red-500">-{formatCurrency(order.commission)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                <span className="font-semibold text-gray-900 dark:text-white">Your earnings</span>
                <span className="font-bold text-wallet text-base">{formatCurrency(order.creatorEarnings)}</span>
              </div>
              <div className={`text-center text-xs py-1.5 rounded-full font-medium ${order.paymentStatus === 'released' ? 'bg-green-100 text-green-700' : 'bg-wallet/10 text-wallet'}`}>
                {order.paymentStatus === 'in_escrow' ? '🔒 Secured in Escrow' : '✅ Released to Wallet'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">Messages</h3>
            <p className="text-sm text-gray-500 mb-3">{order.messages} messages with {order.brand}</p>
            <Link to="/creator/messages" className="btn btn-outline btn-sm w-full">
              <MessageSquare size={14} /> Open Chat
            </Link>
          </div>

          {/* Revisions */}
          <div className="card p-5">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-2">Revisions</h3>
            <p className="text-sm text-gray-500">Used: {order.revisions} of {order.maxRevisions} revisions</p>
            <div className="flex gap-1 mt-2">
              {[...Array(order.maxRevisions)].map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${i < order.revisions ? 'bg-orange-400' : 'bg-gray-100 dark:bg-gray-800'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
