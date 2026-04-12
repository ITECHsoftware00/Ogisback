import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const roles = [
  {
    id: 'creator',
    emoji: '🎬',
    title: 'Influencer / Creator',
    subtitle: 'I create content & partner with brands',
    perks: ['Keep 80% of every deal', 'Secure escrow payments', 'Direct brand connections', 'Free to join — always'],
    gradient: 'from-purple-600 to-pink-600',
    border: 'border-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    check: 'text-purple-500',
    ring: 'ring-purple-400',
    oauthProvider: 'instagram',
  },
  {
    id: 'brand',
    emoji: '🏢',
    title: 'Brand',
    subtitle: 'I hire creators for campaigns',
    perks: ['Access 6,000+ verified creators', 'Campaign management tools', 'Escrow payment protection', 'Analytics & reporting'],
    gradient: 'from-blue-600 to-cyan-500',
    border: 'border-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    check: 'text-blue-500',
    ring: 'ring-blue-400',
    oauthProvider: 'google',
  },
];

export default function Signup() {
  const { signInWithGoogle, signInWithInstagram, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [oauthLoading, setOauthLoading] = useState(null);

  useEffect(() => {
    if (isLoggedIn) navigate(activeRole === 'creator' ? '/creator/dashboard' : '/brand/dashboard');
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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] flex flex-col">
      <SEO title="Join OgisBack — Free for Creators & Brands" description="Create your free OgisBack account as a creator or brand." url="/signup" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#EC4899] flex items-center justify-center shadow-sm">
            <span className="font-heading font-bold text-white">O</span>
          </div>
          <span className="font-heading font-bold text-gray-900 dark:text-white text-lg tracking-tight">OgisBack</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-white/5 border border-purple-100 dark:border-white/10 rounded-full px-4 py-1.5">
              <Sparkles size={13} className="text-yellow-500 dark:text-yellow-400" />
              <span className="text-purple-700 dark:text-gray-400 text-xs font-medium">Join 6,000+ creators & brands</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
              Create your account
            </h1>
            <p className="text-gray-500 text-base">Sign in with the right social account for your role</p>
          </div>

          {/* Role info cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {roles.map(role => (
              <div
                key={role.id}
                className={`relative p-5 rounded-2xl border-2 text-left ${role.bg} ${role.border}`}
              >
                <div className="text-3xl mb-3">{role.emoji}</div>
                <div className="font-heading font-bold text-gray-900 dark:text-white text-sm mb-1">{role.title}</div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{role.subtitle}</p>
                <ul className="space-y-1.5">
                  {role.perks.map(p => (
                    <li key={p} className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-500">
                      <CheckCircle size={10} className={`${role.check} flex-shrink-0 mt-0.5`} />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className={`mt-3 text-[10px] font-semibold ${role.check}`}>
                  {role.id === 'creator' ? '→ Sign in with Instagram' : '→ Sign in with Google'}
                </div>
              </div>
            ))}
          </div>

          {/* OAuth buttons — provider determines role automatically */}
          <div className="space-y-3 mb-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogle}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-white dark:bg-white border border-gray-200 dark:border-transparent text-gray-900 text-sm font-semibold transition-all shadow-sm hover:bg-gray-50 dark:hover:bg-gray-100 disabled:opacity-50"
            >
              {oauthLoading === 'google'
                ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                : <GoogleIcon />}
              Join as Brand — Google
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleInstagram}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)' }}
            >
              {oauthLoading === 'instagram'
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <InstagramIcon size={20} />}
              Join as Creator — Instagram
            </motion.button>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mb-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>

          {/* Demo accounts */}
          <div className="pt-5 border-t border-gray-200 dark:border-white/5">
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center mb-3">Just exploring? Try a demo</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { loginAsCreator(); toast.success('Demo: Creator'); }}
                disabled={anyLoading}
                className="py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-xs font-medium transition-all disabled:opacity-40"
              >
                Creator Demo
              </button>
              <button
                onClick={() => { loginAsBrand(); toast.success('Demo: Brand'); }}
                disabled={anyLoading}
                className="py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-xs font-medium transition-all disabled:opacity-40"
              >
                Brand Demo
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
