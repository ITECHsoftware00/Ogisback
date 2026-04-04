import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { user, activeRole } = useAuth();
  const plan = searchParams.get('plan') || 'mini';
  const type = searchParams.get('type'); // 'topup' or null (subscription)
  const topupAmount = searchParams.get('amount');
  const sessionId = searchParams.get('session_id');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!sessionId || !user?.id) return;

    if (type === 'topup') {
      // For top-ups, poll wallet_transactions
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const { data } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'topup')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data || attempts >= 10) { setVerified(true); clearInterval(interval); }
      }, 1500);
      return () => clearInterval(interval);
    }

    // Subscription: poll subscriptions table
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      if (data?.plan === plan || attempts >= 10) { setVerified(true); clearInterval(interval); }
    }, 1500);
    return () => clearInterval(interval);
  }, [sessionId, user?.id, plan, type]);

  const planLabel = plan === 'max' ? 'Max' : 'Mini';
  const dashboardPath = activeRole === 'brand' ? '/brand/discover' : '/creator/dashboard';
  const isTopup = type === 'topup';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] flex items-center justify-center p-6">
      <SEO title="Payment Successful" noindex={true} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/30"
        >
          <CheckCircle size={48} className="text-white" />
        </motion.div>

        <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 mb-6">
          <Sparkles size={13} className="text-green-600" />
          <span className="text-green-700 dark:text-green-400 text-xs font-semibold">
            {isTopup ? `$${topupAmount} added to your wallet` : `You're now on OgisBack ${planLabel}`}
          </span>
        </div>

        <h1 className="text-3xl font-heading font-extrabold text-gray-900 dark:text-white mb-3">
          Payment successful!
        </h1>
        <p className="text-gray-500 mb-2">
          {isTopup
            ? <><span className="font-semibold text-gray-900 dark:text-white">${topupAmount}</span> has been added to your OgisBack wallet and is ready to use on campaigns and creator deals.</>
            : <>Welcome to the <span className="font-semibold text-gray-900 dark:text-white">{planLabel} plan</span>. Your lower platform fee and premium features are now active.</>
          }
        </p>

        {!verified && (
          <p className="text-xs text-gray-400 mb-8 flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin inline-block" />
            Activating your plan…
          </p>
        )}

        {verified && !isTopup && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="card p-5 text-left space-y-3 mb-6">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">What's now unlocked:</p>
              {plan === 'max' ? [
                '✓ Unlimited posts & campaigns',
                '✓ Featured #1 profile listing',
                '✓ Unlimited AI bargain agent',
                '✓ Dedicated account manager',
                '✓ Lower platform fee',
              ] : [
                '✓ Priority profile listing',
                '✓ Full analytics dashboard',
                '✓ AI bargain agent (5/mo)',
                '✓ Live support chat',
                '✓ Lower platform fee',
              ].map(f => (
                <p key={f} className="text-sm text-gray-600 dark:text-gray-400">{f}</p>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={dashboardPath} className="btn btn-primary btn-lg">
            Go to Dashboard <ArrowRight size={16} />
          </Link>
          <Link to="/pricing" className="btn btn-outline btn-lg">
            View Plan Details
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          A receipt has been sent to your email. Questions? <a href="mailto:support@ogisback.com" className="text-primary hover:underline">Contact support</a>
        </p>
      </motion.div>
    </div>
  );
}
