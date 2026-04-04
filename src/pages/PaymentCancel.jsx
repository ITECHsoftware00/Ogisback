import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';

export default function PaymentCancel() {
  const { activeRole } = useAuth();
  const dashboardPath = activeRole === 'brand' ? '/brand/discover' : '/creator/dashboard';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] flex items-center justify-center p-6">
      <SEO title="Payment Cancelled" noindex={true} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-gray-400" />
        </div>

        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
          Payment cancelled
        </h1>
        <p className="text-gray-500 mb-8">
          No worries — you weren't charged. You can upgrade anytime from the Pricing page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/pricing" className="btn btn-primary btn-lg">
            <ArrowLeft size={16} /> Back to Pricing
          </Link>
          <Link to={dashboardPath} className="btn btn-outline btn-lg">
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-8 p-4 card text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <MessageCircle size={14} className="text-primary" /> Need help choosing a plan?
          </p>
          <p className="text-xs text-gray-500">
            Our team is happy to walk you through which plan fits your goals.{' '}
            <a href="mailto:support@ogisback.com" className="text-primary hover:underline font-medium">Email us</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
