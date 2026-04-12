import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

/**
 * Landing page after OAuth redirect.
 * AuthContext handles all profile creation via onAuthStateChange → fetchProfile.
 * This page just waits for settling to finish, then redirects to the dashboard.
 */
export default function AuthCallback() {
  const { user, loading, settling } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until AuthContext has finished both initial load and SIGNED_IN settling
    if (loading || settling) return;

    if (user) {
      const dest =
        user.role === 'creator' ? '/creator/dashboard'
        : user.role === 'brand' ? '/brand/discover'
        : '/admin';
      navigate(dest, { replace: true });
    } else {
      // No session after settling — auth failed or user denied
      navigate('/login', { replace: true });
    }
  }, [user, loading, settling]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0F] gap-5">
      <SEO title="Signing in…" noindex={true} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center shadow-lg"
      >
        <span className="text-white font-heading font-bold text-2xl">O</span>
      </motion.div>

      <div className="w-10 h-10 border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 rounded-full animate-spin" />

      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  );
}
