import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const creatorPerks = [
  'Keep 80% of every deal',
  'Secure escrow payments',
  'Direct brand connections',
  'Free to join — always',
];

const brandPerks = [
  'Access 6,000+ creators',
  'Campaign management tools',
  'Escrow payment protection',
  'Analytics & reporting',
];

export default function Signup() {
  const { signInWithGoogle, signInWithInstagram, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    if (isLoggedIn) navigate(
      activeRole === 'creator' ? '/creator/dashboard' : '/brand/dashboard'
    , { replace: true });
  }, [isLoggedIn]);

  const handleGoogle = async () => {
    setLoading('google');
    try { await signInWithGoogle(); }
    catch (err) { toast.error(err.message || 'Google sign-in failed.'); setLoading(null); }
  };

  const handleInstagram = async () => {
    setLoading('instagram');
    try { await signInWithInstagram(); }
    catch (err) { toast.error(err.message || 'Instagram sign-in failed.'); setLoading(null); }
  };

  const busy = !!loading;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090F] flex flex-col">
      <SEO title="Join OgisBack" description="Create your free OgisBack account." url="/signup" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-sm">
            <span className="font-heading font-bold text-white text-sm">O</span>
          </div>
          <span className="font-heading font-bold text-gray-900 dark:text-white tracking-tight">OgisBack</span>
        </Link>
        <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          Already have an account? <span className="text-violet-600 dark:text-violet-400 font-semibold">Sign in</span>
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
              Join OgisBack
            </h1>
            <p className="text-gray-400 text-base">
              Choose how you want to sign up — your role is set automatically
            </p>
          </div>

          {/* Two cards side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

            {/* Creator card */}
            <div className="relative bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-7 flex flex-col overflow-hidden">
              {/* Accent glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-pink-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />

              <div className="relative">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-200 dark:border-violet-800/50 rounded-full px-3 py-1 mb-5">
                  <span className="text-violet-600 dark:text-violet-400 text-xs font-semibold">Creator / Influencer</span>
                </div>

                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1.5">
                  I create content
                </h2>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                  Partner with brands, get paid through secure escrow, build your business.
                </p>

                <ul className="space-y-2.5 mb-7">
                  {creatorPerks.map(p => (
                    <li key={p} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileTap={{ scale: 0.985 }}
                  onClick={handleInstagram}
                  disabled={busy}
                  className="w-full flex items-center gap-3 h-12 px-5 rounded-2xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 50%, #EC4899 100%)' }}
                >
                  {loading === 'instagram'
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    : <>
                        <InstagramIcon />
                        <span className="flex-1 text-left">Join with Instagram</span>
                        <span className="text-white/50 text-xs">Free</span>
                      </>
                  }
                </motion.button>
              </div>
            </div>

            {/* Brand card */}
            <div className="relative bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] rounded-3xl p-7 flex flex-col overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-full px-3 py-1 mb-5">
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">Brand / Business</span>
                </div>

                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1.5">
                  I hire creators
                </h2>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                  Find and work with the right creators for your campaigns, all in one place.
                </p>

                <ul className="space-y-2.5 mb-7">
                  {brandPerks.map(p => (
                    <li key={p} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-4 h-4 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileTap={{ scale: 0.985 }}
                  onClick={handleGoogle}
                  disabled={busy}
                  className="w-full flex items-center gap-3 h-12 px-5 rounded-2xl bg-white dark:bg-white border border-gray-200 dark:border-transparent text-gray-900 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-100 disabled:opacity-50 transition-all"
                >
                  {loading === 'google'
                    ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
                    : <>
                        <GoogleIcon />
                        <span className="flex-1 text-left">Join with Google</span>
                        <span className="text-gray-400 text-xs">Free</span>
                      </>
                  }
                </motion.button>
              </div>
            </div>
          </div>

          {/* Demo + legal */}
          <div className="text-center space-y-4">
            <div className="flex items-center gap-3 max-w-sm mx-auto">
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
              <span className="text-[11px] text-gray-400">or try a demo</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => { loginAsCreator(); toast.success('Creator demo loaded'); }}
                disabled={busy}
                className="h-8 px-4 rounded-xl text-xs font-medium bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 transition-all disabled:opacity-40"
              >
                Creator Demo
              </button>
              <button
                onClick={() => { loginAsBrand(); toast.success('Brand demo loaded'); }}
                disabled={busy}
                className="h-8 px-4 rounded-xl text-xs font-medium bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 transition-all disabled:opacity-40"
              >
                Brand Demo
              </button>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-600">
              By signing up you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
