import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
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

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const roles = {
  creator: {
    label: 'Creator / Influencer',
    perks: [
      'Keep 80% of every deal',
      'Secure escrow payments',
      'Direct brand connections',
      'Free to join — always',
    ],
  },
  brand: {
    label: 'Brand / Business',
    perks: [
      'Access 6,000+ creators',
      'Campaign management tools',
      'Escrow payment protection',
      'Analytics & reporting',
    ],
  },
};

const sharedPerks = [
  'Over 6,000+ verified creators',
  'Secure escrow on every deal',
  'Quality campaigns done faster',
  'Access to talent & brands worldwide',
];

export default function Signup() {
  const { signInWithGoogle, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [role, setRole] = useState('creator');

  useEffect(() => {
    if (isLoggedIn) navigate(
      activeRole === 'creator' ? '/creator/dashboard' : '/brand/dashboard',
      { replace: true }
    );
  }, [isLoggedIn]);

  const handleGoogle = async () => {
    setLoading('google');
    try { await signInWithGoogle(role); }
    catch (err) { toast.error(err.message || 'Google sign-in failed.'); setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#09090F] flex flex-col items-center justify-center p-4">
      <SEO title="Join OgisBack" description="Create your free OgisBack account." url="/signup" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl bg-white dark:bg-[#111118] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden flex flex-col md:flex-row"
      >
        {/* ── Left panel ── */}
        <div
          className="relative md:w-[42%] flex-shrink-0 flex flex-col justify-between p-8 overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1a0533 0%, #2d0a5e 40%, #1e1050 70%, #0d1a3a 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 -left-10 w-40 h-40 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 mb-10">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow">
                <span className="font-bold text-white text-xs">O</span>
              </div>
              <span className="font-bold text-white text-sm tracking-tight">OgisBack</span>
            </Link>

            <h2 className="text-2xl font-extrabold text-white leading-snug mb-6">
              Success starts here
            </h2>

            <ul className="space-y-3.5">
              {sharedPerks.map(perk => (
                <li key={perk} className="flex items-start gap-3 text-sm text-white/80">
                  <CheckIcon />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom tagline */}
          <p className="relative text-white/30 text-xs mt-8">
            Trusted by creators & brands worldwide
          </p>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col justify-center p-8">
          <div className="max-w-xs mx-auto w-full">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Create a new account
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
                Sign in
              </Link>
            </p>

            {/* Role tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl mb-6">
              {Object.entries(roles).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setRole(key)}
                  disabled={loading === 'google'}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    role === key
                      ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>

            {/* Perks for selected role */}
            <AnimatePresence mode="wait">
              <motion.ul
                key={role}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-1.5 mb-6"
              >
                {roles[role].perks.map(perk => (
                  <li key={perk} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3 flex-shrink-0 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>

            {/* Auth buttons */}
            <div>
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={handleGoogle}
                disabled={loading === 'google'}
                className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] text-gray-800 dark:text-gray-200 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-all"
              >
                {loading === 'google'
                  ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
                  : <><GoogleIcon /><span>Continue with Google</span></>
                }
              </motion.button>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-5 leading-relaxed">
              By joining, you agree to our{' '}
              <span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span>{' '}
              and{' '}
              <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
