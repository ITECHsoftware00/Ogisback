import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function AuthCallback() {
  const { user, loading, settling } = useAuth();
  const navigate = useNavigate();
  // Safety net: if after 10s there's still no user, give up and send to signup
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Keep waiting while auth context is still working
    if (loading || settling) return;
    // Also keep waiting if we have a ?code= but no user yet (SIGNED_IN hasn't fired)
    const hasCode = new URLSearchParams(window.location.search).has('code');
    if (hasCode && !user && !timedOut) return;

    if (user) {
      const isNewUser = !user.profileComplete;
      const role = user.role;

      if (isNewUser) {
        if (role === 'creator') {
          navigate('/creator/profile/edit?setup=true', { replace: true });
        } else if (role === 'brand') {
          navigate('/brand/settings?setup=true', { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      } else {
        if (role === 'creator') {
          navigate('/creator/dashboard', { replace: true });
        } else if (role === 'brand') {
          navigate('/brand/dashboard', { replace: true });
        } else {
          navigate('/admin', { replace: true });
        }
      }
    } else {
      // No session after settling — auth failed or user denied
      navigate('/signup', { replace: true });
    }
  }, [user, loading, settling, timedOut]);

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
