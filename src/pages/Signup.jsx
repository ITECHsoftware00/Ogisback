import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const creatorPerks = ['Free to join', 'Keep 80% of every deal', 'OgisBack watermark on all content', 'Secure escrow payments', 'Direct brand connections'];
const brandPerks = ['Access to 6,000+ verified creators', 'Campaign management tools', 'Escrow payment protection', 'Analytics & reporting', 'Dedicated support'];

export default function Signup() {
  const { signup, signInWithGoogle, signInWithInstagram, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const [oauthLoading, setOauthLoading] = useState(null);
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null); // 'creator' | 'brand'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate(activeRole === 'creator' ? '/creator/dashboard' : '/brand/discover');
  }, [isLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(email, password, selectedRole, name.trim());
      toast.success('Account created! Setting up your profile…');
      navigate(selectedRole === 'creator' ? '/creator/profile/edit?setup=true' : '/brand/settings?setup=true');
    } catch (err) {
      toast.error(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreatorDemo = () => {
    loginAsCreator();
    toast.success('Demo: Logged in as Creator');
  };
  const handleBrandDemo = () => {
    loginAsBrand();
    toast.success('Demo: Logged in as Brand');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0F] py-12 px-4">
      <SEO title="Join OgisBack — Free for Creators & Brands" description="Create your free OgisBack account. Join as a creator to get discovered by brands, or sign up as a brand to find and hire top content creators." url="/signup" />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          {selectedRole ? (
            <button onClick={() => setSelectedRole(null)} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm transition-colors">
              <ArrowLeft size={16} /> Back to home
            </Link>
          )}
        </div>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-creator flex items-center justify-center shadow-glow-creator">
              <span className="text-white font-heading font-bold text-lg">O</span>
            </div>
          </div>
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">Join OgisBack</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {selectedRole ? `Creating your ${selectedRole} account` : 'Choose your path to get started'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedRole ? (
            /* ── Step 1: Role selection ── */
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* OAuth quick sign-up */}
              <div className="md:col-span-2 space-y-3 mb-2">
                <button
                  onClick={handleGoogle}
                  disabled={!!oauthLoading || loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#1a1a24] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#22222e] transition-all shadow-sm disabled:opacity-60"
                >
                  {oauthLoading === 'google'
                    ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                    : <GoogleIcon />}
                  Continue with Google
                </button>
                <button
                  onClick={handleInstagram}
                  disabled={!!oauthLoading || loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-60"
                >
                  {oauthLoading === 'instagram'
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <InstagramIcon size={18} />}
                  Continue with Instagram
                </button>
                <div className="relative flex items-center gap-3 pt-1">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">or sign up with email below</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>

              {/* Creator card */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-8 border-2 border-transparent hover:border-creator/30 transition-all group cursor-pointer"
                onClick={() => setSelectedRole('creator')}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-instagram flex items-center justify-center mb-5 shadow-glow-creator">
                  <InstagramIcon size={28} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">I'm a Creator</h2>
                <p className="text-gray-500 mb-6">Get discovered by brands and start earning from your content.</p>
                <ul className="space-y-3 mb-8">
                  {creatorPerks.map(p => (
                    <li key={p} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle size={16} className="text-creator flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <button className="btn w-full py-3 rounded-2xl text-white text-base font-semibold bg-gradient-instagram hover:opacity-90 transition-opacity shadow-glow-creator flex items-center justify-center gap-2">
                  Sign up as Creator <ArrowRight size={16} />
                </button>
              </motion.div>

              {/* Brand card */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-8 border-2 border-transparent hover:border-brand/30 transition-all group cursor-pointer"
                onClick={() => setSelectedRole('brand')}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current text-white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">I'm a Brand</h2>
                <p className="text-gray-500 mb-6">Find and hire top content creators for your campaigns.</p>
                <ul className="space-y-3 mb-8">
                  {brandPerks.map(p => (
                    <li key={p} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle size={16} className="text-brand flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <button className="btn w-full py-3 rounded-2xl bg-gradient-brand text-white text-base font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  Sign up as Brand <ArrowRight size={16} />
                </button>
              </motion.div>

              {/* Demo accounts */}
              <div className="md:col-span-2">
                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">or try a demo account</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button onClick={handleCreatorDemo} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-creator/10 text-creator border border-creator/20 text-sm font-semibold hover:bg-creator/20 transition-all">
                    <InstagramIcon size={16} /> Creator Demo
                  </button>
                  <button onClick={handleBrandDemo} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-brand/10 text-brand border border-brand/20 text-sm font-semibold hover:bg-brand/20 transition-all">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    Brand Demo
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── Step 2: Registration form ── */
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-md mx-auto"
            >
              {/* Role badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 ${
                selectedRole === 'creator'
                  ? 'bg-creator/10 text-creator border border-creator/20'
                  : 'bg-brand/10 text-brand border border-brand/20'
              }`}>
                {selectedRole === 'creator' ? <InstagramIcon size={14} /> : <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                {selectedRole === 'creator' ? 'Creator Account' : 'Brand Account'}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label">{selectedRole === 'creator' ? 'Full name' : 'Brand / Company name'}</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={selectedRole === 'creator' ? 'Your full name' : 'Your brand name'}
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>

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
                      placeholder="At least 6 characters"
                      className="input pl-9 pr-10"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-lg w-full disabled:opacity-60 ${selectedRole === 'creator' ? 'btn-creator' : 'btn-brand'}`}
                >
                  {loading
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</span>
                    : <>Create {selectedRole === 'creator' ? 'Creator' : 'Brand'} Account <ArrowRight size={16} /></>
                  }
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 text-center">
                  By signing up, you agree to OgisBack's Terms of Service and Privacy Policy.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
