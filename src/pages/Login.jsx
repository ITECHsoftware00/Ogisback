import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InstagramIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

export default function Login() {
  const { login, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      navigate(activeRole === 'creator' ? '/creator/dashboard' : '/brand/discover');
    }
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter your email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo logins (keep for development)
  const handleCreatorDemo = async () => {
    setLoading(true);
    try {
      loginAsCreator();
      toast.success('Demo: Logged in as Creator');
    } finally {
      setLoading(false);
    }
  };
  const handleBrandDemo = async () => {
    setLoading(true);
    try {
      loginAsBrand();
      toast.success('Demo: Logged in as Brand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] flex">
      <SEO title="Log In" description="Log in to your OgisBack account." url="/login" noindex={true} />

      {/* Left gradient panel */}
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
            <p className="text-white/80 text-lg mb-8">The content-first influencer marketplace.</p>
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
            {[47, 48, 49, 50].map((img, i) => (
              <img key={img} src={`https://i.pravatar.cc/40?img=${img}`} alt="" className="w-10 h-10 rounded-full border-2 border-white/50 object-cover" style={{ marginLeft: i > 0 ? '-8px' : 0 }} />
            ))}
            <p className="ml-3 text-sm text-white/80 self-center">Join 6,000+ creators</p>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-creator flex items-center justify-center">
              <span className="text-white font-heading font-bold">O</span>
            </div>
            <span className="font-heading font-bold text-xl text-gray-900 dark:text-white">OgisBack</span>
          </div>

          <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Sign in to your account to continue</p>

          {/* Email/Password form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            <div className="form-group">
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-9"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="input pl-9 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-creator btn-lg w-full disabled:opacity-60"
            >
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span>
                : <><LogIn size={17} /> Sign In</>
              }
            </button>
          </form>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">or try a demo account</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Demo quick logins */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={handleCreatorDemo}
              disabled={loading}
              className="flex items-center gap-2 p-3 rounded-xl bg-creator/10 text-creator border border-creator/20 text-sm font-semibold hover:bg-creator/20 transition-all"
            >
              <InstagramIcon size={16} /> Creator Demo
            </button>
            <button
              onClick={handleBrandDemo}
              disabled={loading}
              className="flex items-center gap-2 p-3 rounded-xl bg-brand/10 text-brand border border-brand/20 text-sm font-semibold hover:bg-brand/20 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              Brand Demo
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              By signing in, you agree to OgisBack's Terms of Service and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
