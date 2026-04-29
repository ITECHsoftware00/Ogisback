import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Crown, Zap, CheckCircle, ArrowRight, ExternalLink,
  RefreshCw, AlertCircle, CreditCard, Calendar, Loader2, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getSubscription, cancelSubscription, openCustomerPortal } from '../lib/payments';

const PLAN_META = {
  free: {
    label: 'Free',
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: null,
    perks: { creator: ['5 posts/month', '20% platform fee', 'Basic analytics'], brand: ['2 campaigns', '20% platform fee', 'Standard discovery'] },
  },
  mini: {
    label: 'Mini',
    color: 'text-creator',
    bg: 'bg-creator/10',
    border: 'border-creator/30',
    icon: Star,
    perks: { creator: ['50 posts/month', '18% platform fee', 'AI bargain agent (5/mo)', 'Priority listing'], brand: ['10 campaigns', '15% platform fee', 'AI negotiation', 'Priority matching'] },
  },
  max: {
    label: 'Max',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: Crown,
    perks: { creator: ['Unlimited posts', '15% platform fee', 'Unlimited AI agent', 'Featured #1 slot'], brand: ['Unlimited campaigns', '10% platform fee', 'Dedicated manager', 'Top creator access'] },
  },
};

const PLAN_PRICE = {
  creator: { mini: { monthly: 9.99, annual: 7.99 }, max: { monthly: 29.99, annual: 23.99 } },
  brand:   { mini: { monthly: 49,   annual: 39   }, max: { monthly: 149,   annual: 119   } },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SubscriptionBilling({ role }) {
  const { user, plan: currentPlan } = useAuth();
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getSubscription(user.id)
      .then(setSub)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const planMeta = PLAN_META[currentPlan] ?? PLAN_META.free;
  const PlanIcon = planMeta.icon;
  const isPaid = currentPlan !== 'free';
  const billingCycle = sub?.billing_cycle ?? 'monthly';
  const price = isPaid ? PLAN_PRICE[role]?.[currentPlan]?.[billingCycle] : 0;

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal(user.id);
    } catch {
      toast.error('Could not open billing portal. Contact support.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You keep your plan until the end of the billing period.')) return;
    setCancelling(true);
    try {
      await cancelSubscription(user.id);
      toast.success('Subscription cancelled. Your plan stays active until ' + formatDate(sub?.current_period_end));
      setSub(s => s ? { ...s, cancel_at_period_end: true } : s);
    } catch (err) {
      toast.error(err.message || 'Could not cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 flex items-center gap-3 text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Loading billing info…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card border-2 ${planMeta.border} overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 ${planMeta.bg} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {PlanIcon && (
              <div className="w-9 h-9 rounded-xl bg-white/50 dark:bg-black/20 flex items-center justify-center">
                <PlanIcon size={18} className={planMeta.color} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-heading font-bold text-lg ${planMeta.color}`}>
                  OgisBack {planMeta.label}
                </span>
                {sub?.cancel_at_period_end && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Cancels {formatDate(sub.current_period_end)}</span>
                )}
                {sub?.status === 'trialing' && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Trial</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isPaid
                  ? `$${price}/mo · billed ${billingCycle}`
                  : 'No charge — free forever'}
              </p>
            </div>
          </div>
          {isPaid && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Next billing</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(sub?.current_period_end)}</p>
            </div>
          )}
        </div>

        {/* Perks */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-2">
            {(planMeta.perks[role] ?? []).map(p => (
              <div key={p} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
          {!isPaid ? (
            <>
              <Link to="/pricing" className="btn btn-primary btn-sm">
                <Zap size={14} /> Upgrade Plan <ArrowRight size={13} />
              </Link>
              <p className="text-xs text-gray-400 self-center">Unlock lower fees, AI tools & more</p>
            </>
          ) : (
            <>
              <button
                onClick={handleManage}
                disabled={portalLoading}
                className="btn btn-outline btn-sm"
              >
                {portalLoading
                  ? <><Loader2 size={13} className="animate-spin" /> Opening…</>
                  : <><ExternalLink size={13} /> Manage Billing</>}
              </button>
              <Link to="/pricing" className="btn btn-ghost btn-sm text-primary">
                <Crown size={13} /> {currentPlan === 'mini' ? 'Upgrade to Max' : 'View Plans'}
              </Link>
              {!sub?.cancel_at_period_end && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                >
                  {cancelling
                    ? <><Loader2 size={13} className="animate-spin" /> Cancelling…</>
                    : 'Cancel Subscription'}
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* How subscription payments work */}
      <div className="card p-6">
        <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <CreditCard size={16} className="text-brand" /> How Subscription Payments Work
        </h3>
        <div className="space-y-0">
          {[
            {
              icon: '1',
              title: 'Pick your plan',
              desc: 'Choose Mini or Max on the Pricing page. 7-day free trial on your first paid plan.',
              color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
            },
            {
              icon: '2',
              title: 'Stripe secure checkout',
              desc: "You're redirected to Stripe's hosted page. Enter your card — OgisBack never sees your card number.",
              color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
            },
            {
              icon: '3',
              title: 'Instant plan activation',
              desc: 'Stripe confirms payment → your plan upgrades within seconds. Lower fee applies to your next deal immediately.',
              color: 'bg-green-100 dark:bg-green-900/30 text-green-600',
            },
            {
              icon: '4',
              title: 'Auto-renews monthly or annually',
              desc: 'Stripe charges your card on the same date each cycle. Cancel anytime — you keep the plan until period ends.',
              color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
            },
          ].map((step, i, arr) => (
            <div key={i} className="flex gap-4 relative">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center text-sm font-bold flex-shrink-0 z-10`}>
                  {step.icon}
                </div>
                {i < arr.length - 1 && (
                  <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
                )}
              </div>
              <div className={`pb-${i < arr.length - 1 ? '5' : '0'} pt-1`}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Security badges */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
          {[
            '🔒 Powered by Stripe',
            '🛡️ PCI DSS Level 1',
            '🔁 Cancel anytime',
            '💸 7-day free trial',
          ].map(badge => (
            <span key={badge} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full font-medium">
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Billing portal note if paid */}
      {isPaid && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl">
          <AlertCircle size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>Manage Billing</strong> opens your Stripe customer portal where you can update your card, download invoices, and view full payment history — all secured by Stripe.
          </p>
        </div>
      )}
    </div>
  );
}
