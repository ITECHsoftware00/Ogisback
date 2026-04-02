import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const InstagramIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate(activeRole === 'creator' ? '/creator/dashboard' : '/brand/discover');
    }
  }, [isLoggedIn]);

  const handleCreatorLogin = () => {
    const user = loginAsCreator();
    toast.success('Welcome to OgisBack as a Creator!');
    if (!user.profileComplete) navigate('/creator/profile/edit?setup=true');
    else navigate('/creator/dashboard');
  };

  const handleBrandLogin = () => {
    const user = loginAsBrand();
    toast.success('Welcome to OgisBack as a Brand!');
    if (!user.profileComplete) navigate('/brand/settings?setup=true');
    else navigate('/brand/discover');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] flex">
      <SEO title="Log In" description="Log in to your OgisBack account as a creator or brand." url="/login" noindex={true} />
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#7C3AED] via-[#EC4899] to-[#F59E0B] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="font-heading font-bold text-lg">O</span>
            </div>
            <span className="font-heading font-bold text-xl">OgisBack</span>
          </Link>
          <div>
            <h1 className="text-4xl font-heading font-bold mb-4 leading-tight">Where Creators<br />Meet Brands</h1>
            <p className="text-white/80 text-lg mb-8">The content-first influencer marketplace. Post content. Get discovered. Earn from your passion.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '6,000+', label: 'Active Creators' },
                { num: '$2.4M+', label: 'Paid to Creators' },
                { num: '1,200+', label: 'Brand Campaigns' },
                { num: '98%', label: 'Satisfaction Rate' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="font-heading font-bold text-2xl">{s.num}</p>
                  <p className="text-white/70 text-sm">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {['Sarah Chen', 'Marcus Williams', 'Priya Sharma', 'David Okonkwo'].map((name, i) => (
              <img key={name} src={`https://i.pravatar.cc/40?img=${47 + i}`} alt={name} className="w-10 h-10 rounded-full border-2 border-white/50 object-cover" style={{ marginLeft: i > 0 ? '-8px' : 0 }} />
            ))}
            <p className="ml-3 text-sm text-white/80 self-center">Join 6,000+ creators</p>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-creator flex items-center justify-center">
              <span className="text-white font-heading font-bold">O</span>
            </div>
            <span className="font-heading font-bold text-xl text-gray-900 dark:text-white">OgisBack</span>
          </div>

          <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Choose how you want to continue</p>

          {/* Creator login */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCreatorLogin}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-instagram text-white font-semibold text-base mb-4 hover:opacity-95 shadow-lg transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <InstagramIcon size={22} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Continue with Instagram</p>
              <p className="text-white/80 text-sm font-normal">For Creators & Influencers</p>
            </div>
            <div className="ml-auto opacity-60 group-hover:opacity-100 transition-opacity">→</div>
          </motion.button>

          {/* Brand login */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleBrandLogin}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 font-semibold text-base hover:bg-gray-50 shadow-card transition-all group dark:bg-[#111118] dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold">Continue with Google</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-normal">For Brands & Businesses</p>
            </div>
            <div className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors">→</div>
          </motion.button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up free</Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              By continuing, you agree to OgisBack's Terms of Service and Privacy Policy.
              No passwords required — we use OAuth for secure login.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
