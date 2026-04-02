import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
import { useAuth } from '../context/AuthContext';

const creatorPerks = ['Free to join', 'Keep 80% of every deal', 'OgisBack watermark on all content', 'Secure escrow payments', 'Direct brand connections'];
const brandPerks = ['Access to 6,000+ verified creators', 'Campaign management tools', 'Escrow payment protection', 'Analytics & reporting', 'Dedicated support'];

export default function Signup() {
  const { loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate(activeRole === 'creator' ? '/creator/dashboard' : '/brand/discover');
  }, [isLoggedIn]);

  const handleCreator = () => {
    loginAsCreator();
    toast.success('Account created! Let\'s set up your creator profile.');
    navigate('/creator/profile/edit?setup=true');
  };
  const handleBrand = () => {
    loginAsBrand();
    toast.success('Account created! Let\'s set up your brand profile.');
    navigate('/brand/settings?setup=true');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] py-12 px-4">
      <SEO title="Join OgisBack — Free for Creators & Brands" description="Create your free OgisBack account. Join as a creator to get discovered by brands, or sign up as a brand to find and hire top content creators." url="/signup" />
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-creator flex items-center justify-center shadow-glow-creator">
              <span className="text-white font-heading font-bold text-lg">O</span>
            </div>
          </div>
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">Join OgisBack</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Choose your path to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Creator card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 border-2 border-transparent hover:border-creator/30 transition-all group cursor-pointer"
            onClick={handleCreator}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-instagram flex items-center justify-center mb-5 shadow-glow-creator">
              <InstagramIcon size={28} />
            </div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">I'm a Creator</h2>
            <p className="text-gray-500 mb-6">Sign up with Instagram and start getting paid for your content today.</p>
            <ul className="space-y-3 mb-8">
              {creatorPerks.map(p => (
                <li key={p} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={16} className="text-creator flex-shrink-0" /> {p}
                </li>
              ))}
            </ul>
            <button className="btn w-full py-3 rounded-2xl text-white text-base font-semibold bg-gradient-instagram hover:opacity-90 transition-opacity shadow-glow-creator">
              <InstagramIcon size={18} /> Continue with Instagram
            </button>
          </motion.div>

          {/* Brand card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8 border-2 border-transparent hover:border-brand/30 transition-all group cursor-pointer"
            onClick={handleBrand}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" className="w-7 h-7">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" opacity="0.9"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" opacity="0.8"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white" opacity="0.7"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">I'm a Brand</h2>
            <p className="text-gray-500 mb-6">Sign up with Google and start discovering creators for your campaigns.</p>
            <ul className="space-y-3 mb-8">
              {brandPerks.map(p => (
                <li key={p} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={16} className="text-brand flex-shrink-0" /> {p}
                </li>
              ))}
            </ul>
            <button className="btn w-full py-3 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 text-base font-semibold hover:bg-gray-50 transition-all dark:bg-[#111118] dark:border-gray-700 dark:text-white">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </motion.div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
