import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] flex items-center justify-center px-4">
      <SEO title="404 — Page Not Found" description="This page doesn't exist on OgisBack." noindex={true} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-heading font-extrabold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-3">Page not found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn btn-primary btn-lg"><Home size={18} /> Go Home</Link>
          <button onClick={() => window.history.back()} className="btn btn-outline btn-lg"><ArrowLeft size={18} /> Go Back</button>
        </div>
      </motion.div>
    </div>
  );
}
