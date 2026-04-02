import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles } from 'lucide-react';
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
  { num: '98%', label: 'Satisfaction' },
];

export default function Login() {
  const { signInWithGoogle, signInWithInstagram, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [oauthLoading, setOauthLoading] = useState(null);

  useEffect(() => {
    if (isLoggedIn) navigate(activeRole === 'creator' ? '/creator/dashboard' : '/brand/discover');
  }, [isLoggedIn]);

  const handleGoogle = async () => {
    setOauthLoading('google');
    try { await signInWithGoogle(); }
    catch (err) { toast.error(err.message || 'Google sign-in failed.'); setOauthLoading(null); }
  };

  const handleInstagram = async () => {
    setOauthLoading('instagram');
    try { await signInWithInstagram(); }
    catch (err) { toast.error(err.message || 'Instagram sign-in failed.'); setOauthLoading(null); }
  };

  const anyLoading = !!oauthLoading;

  return (
    <div className="min-h-screen flex bg-[#0A0A0F]">
      <SEO title="Log In" description="Log in to your OgisBack account." url="/login" noindex={true} />

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14">
        {/* Gradient background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#C026D3] to-[#EC4899]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.15),transparent_60%)]" />
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="font-heading font-bold text-white text-lg">O</span>
            </div>
            <span className="font-heading font-bold text-white text-xl tracking-tight">OgisBack</span>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles size={13} className="text-yellow-300" />
            <span className="text-white/90 text-xs font-medium">Trusted by 6,000+ creators worldwide</span>
          </div>
          <h1 className="text-5xl font-heading font-extrabold text-white leading-[1.1] mb-5 tracking-tight">
            Where Creators<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Meet Brands</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            The content-first influencer marketplace. Get paid for your creativity.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-10">
            {stats.map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <div className="font-heading font-extrabold text-white text-xl">{s.num}</div>
                <div className="text-white/60 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Avatars */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex">
            {[47, 48, 49, 50, 51].map((img, i) => (
              <img key={img} src={`https://i.pravatar.cc/36?img=${img}`} alt="" className="w-9 h-9 rounded-full border-2 border-white/40 object-cover" style={{ marginLeft: i > 0 ? '-10px' : 0 }} />
            ))}
          </div>
          <p className="text-white/70 text-sm">Join thousands of creators earning today</p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0D0D14]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center">
              <span className="text-white font-heading font-bold">O</span>
            </div>
            <span className="font-heading font-bold text-white text-xl">OgisBack</span>
          </div>

          <Link to="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-10 transition-colors">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl font-heading font-extrabold text-white tracking-tight mb-2">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* ── OAuth buttons ── */}
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogle}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 transition-all shadow-lg shadow-black/20 disabled:opacity-50"
            >
              {oauthLoading === 'google'
                ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                : <GoogleIcon />}
              Continue with Google
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleInstagram}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-all shadow-lg shadow-pink-900/30 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)' }}
            >
              {oauthLoading === 'instagram'
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <InstagramIcon />}
              Continue with Instagram
            </motion.button>
          </div>

          {/* Demo accounts — subtle */}
          <div className="mt-8 pt-8 border-t border-white/5 space-y-2">
            <p className="text-xs text-gray-600 text-center mb-3">Try a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { loginAsCreator(); toast.success('Demo: Creator'); }}
                disabled={anyLoading}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs font-medium transition-all disabled:opacity-40"
              >
                Creator Demo
              </button>
              <button
                onClick={() => { loginAsBrand(); toast.success('Demo: Brand'); }}
                disabled={anyLoading}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-xs font-medium transition-all disabled:opacity-40"
              >
                Brand Demo
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign up free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
