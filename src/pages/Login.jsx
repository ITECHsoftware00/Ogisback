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

const stats = [
  { num: '6,000+', label: 'Creators' },
  { num: '$2.4M+', label: 'Paid Out' },
  { num: '1,200+', label: 'Campaigns' },
  { num: '98%',    label: 'Satisfaction' },
];

export default function Login() {
  const { signInWithGoogle, signInWithInstagram, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    if (isLoggedIn) navigate(
      activeRole === 'admin' ? '/admin'
      : activeRole === 'creator' ? '/creator/dashboard'
      : '/brand/dashboard'
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
    <div className="min-h-screen flex bg-white dark:bg-[#09090F]">
      <SEO title="Sign In" noindex={true} />

      {/* Left panel */}
      <div className="hidden lg:flex w-[46%] relative overflow-hidden flex-col justify-between p-12 bg-[#0A0A12]">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-purple-950 to-[#0A0A12]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_20%,rgba(139,92,246,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_20%_80%,rgba(236,72,153,0.12),transparent)]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '48px 48px' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="font-heading font-bold text-white">O</span>
            </div>
            <span className="font-heading font-bold text-white text-lg tracking-tight">OgisBack</span>
          </Link>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/70 text-xs font-medium">6,000+ creators earning today</span>
          </div>

          <h1 className="text-4xl font-heading font-extrabold text-white leading-[1.1] mb-4 tracking-tight">
            Where Creators<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              Meet Brands
            </span>
          </h1>

          <p className="text-white/50 text-base leading-relaxed max-w-xs mb-10">
            The influencer marketplace built for real deals — escrow payments, direct connections, no middlemen.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map(s => (
              <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
                <div className="font-heading font-extrabold text-white text-2xl tracking-tight">{s.num}</div>
                <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Avatars */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex">
            {[47, 48, 49, 50, 51].map((img, i) => (
              <img key={img} src={`https://i.pravatar.cc/36?img=${img}`} alt=""
                className="w-8 h-8 rounded-full border-2 border-[#0A0A12] object-cover"
                style={{ marginLeft: i > 0 ? '-8px' : 0 }}
              />
            ))}
          </div>
          <p className="text-white/40 text-xs">Joined this week</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-[#FAFAFA] dark:bg-[#0D0D15]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">O</span>
            </div>
            <span className="font-heading font-bold text-gray-900 dark:text-white">OgisBack</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight mb-1.5">
              Welcome back
            </h2>
            <p className="text-gray-400 text-sm">Sign in with your account</p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-8">
            {/* Google → Brand */}
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center gap-3.5 h-[52px] px-5 rounded-2xl bg-white dark:bg-white border border-gray-200 dark:border-transparent text-gray-900 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-100 disabled:opacity-50 transition-all"
            >
              {loading === 'google'
                ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
                : <>
                    <GoogleIcon />
                    <span className="flex-1 text-left">Continue with Google</span>
                    <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Brand</span>
                  </>
              }
            </motion.button>

            {/* Instagram → Creator */}
            <motion.button
              whileTap={{ scale: 0.985 }}
              onClick={handleInstagram}
              disabled={busy}
              className="w-full flex items-center gap-3.5 h-[52px] px-5 rounded-2xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 50%, #EC4899 100%)' }}
            >
              {loading === 'instagram'
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                : <>
                    <InstagramIcon />
                    <span className="flex-1 text-left">Continue with Instagram</span>
                    <span className="text-[10px] font-medium text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Creator</span>
                  </>
              }
            </motion.button>
          </div>

          {/* Provider hint */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
            <span className="text-[11px] text-gray-400 dark:text-gray-600 px-1">Google = Brand · Instagram = Creator</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]" />
          </div>

          {/* Demo accounts */}
          <div className="space-y-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center mb-2.5">Try without signing up</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { loginAsCreator(); toast.success('Creator demo loaded'); }}
                disabled={busy}
                className="h-9 rounded-xl text-xs font-medium bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 transition-all disabled:opacity-40"
              >
                Creator Demo
              </button>
              <button
                onClick={() => { loginAsBrand(); toast.success('Brand demo loaded'); }}
                disabled={busy}
                className="h-9 rounded-xl text-xs font-medium bg-white dark:bg-white/[0.04] hover:bg-gray-50 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 transition-all disabled:opacity-40"
              >
                Brand Demo
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-7">
            New here?{' '}
            <Link to="/signup" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline transition-colors">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
