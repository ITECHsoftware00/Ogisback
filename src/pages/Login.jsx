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

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const stats = [
  { num: '6,000+',  label: 'Creators' },
  { num: '$2.4M+',  label: 'Paid Out' },
  { num: '1,200+',  label: 'Campaigns' },
  { num: '98%',     label: 'Satisfaction' },
];

export default function Login() {
  const { signInWithGoogle, signInWithInstagram, signInWithEmail, resetPassword, resendConfirmation, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [emailError, setEmailError] = useState(null); // 'unconfirmed' | null

  useEffect(() => {
    if (isLoggedIn) navigate(
      activeRole === 'admin'   ? '/admin'
      : activeRole === 'creator' ? '/creator/dashboard'
      : '/brand/dashboard',
      { replace: true }
    );
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

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading('email');
    setEmailError(null);
    try {
      await signInWithEmail(email, password);
      // success — onAuthStateChange fires and navigates
    } catch (err) {
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setEmailError('unconfirmed');
      } else {
        toast.error(err.message || 'Sign-in failed.');
      }
      setLoading(null);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error('Enter your email above first.'); return; }
    setLoading('resend');
    try {
      await resendConfirmation(email);
      toast.success('Confirmation email sent! Check your inbox.');
      setEmailError(null);
    } catch (err) {
      toast.error(err.message || 'Failed to resend.');
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email first.'); return; }
    setLoading('reset');
    try {
      await resetPassword(email);
      toast.success('Password reset email sent!');
      setShowReset(false);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(null);
    }
  };

  const busy = !!loading;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#09090F] flex flex-col items-center justify-center p-4">
      <SEO title="Sign In" noindex={true} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl bg-white dark:bg-[#111118] rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden flex flex-col md:flex-row"
      >
        {/* ── Left panel ── */}
        <div
          className="relative md:w-[46%] flex-shrink-0 flex flex-col justify-between p-8 overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1a0533 0%, #2d0a5e 40%, #1e1050 70%, #0d1a3a 100%)' }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 -left-10 w-44 h-44 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '48px 48px' }}
          />

          <div className="relative z-10">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow">
                <span className="font-bold text-white text-xs">O</span>
              </div>
              <span className="font-bold text-white text-sm tracking-tight">OgisBack</span>
            </Link>

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-xs font-medium">6,000+ creators earning today</span>
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-snug mb-3 tracking-tight">
              Where Creators<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
                Meet Brands
              </span>
            </h2>

            <p className="text-white/50 text-sm leading-relaxed mb-7">
              The influencer marketplace built for real deals — escrow payments, direct connections, no middlemen.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {stats.map(s => (
                <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3.5">
                  <div className="font-extrabold text-white text-xl tracking-tight">{s.num}</div>
                  <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Avatars */}
          <div className="relative z-10 flex items-center gap-3 mt-8">
            <div className="flex">
              {[47, 48, 49, 50, 51].map((img, i) => (
                <img key={img} src={`https://i.pravatar.cc/36?img=${img}`} alt=""
                  className="w-7 h-7 rounded-full border-2 border-[#1a0533] object-cover"
                  style={{ marginLeft: i > 0 ? '-6px' : 0 }}
                />
              ))}
            </div>
            <p className="text-white/40 text-xs">Joined this week</p>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col justify-center p-8">
          {/* Mobile logo */}
          <Link to="/" className="inline-flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <span className="font-bold text-white text-xs">O</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">OgisBack</span>
          </Link>

          <div className="max-w-xs mx-auto w-full">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-7">
              Sign in with your account
            </p>

            {/* Auth buttons */}
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={handleGoogle}
                disabled={busy}
                className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] text-gray-800 dark:text-gray-200 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-all"
              >
                {loading === 'google'
                  ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
                  : <><GoogleIcon /><span>Continue with Google</span></>
                }
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={handleInstagram}
                disabled={busy}
                className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] text-gray-800 dark:text-gray-200 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-all"
              >
                {loading === 'instagram'
                  ? <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto" />
                  : <><InstagramIcon /><span>Continue with Instagram</span></>
                }
              </motion.button>

              {/* Email toggle button */}
              <button
                type="button"
                onClick={() => { setShowEmail(v => !v); setShowReset(false); }}
                disabled={busy}
                className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] text-gray-800 dark:text-gray-200 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-all"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Continue with email</span>
              </button>

              {/* Expandable email form */}
              <AnimatePresence>
                {showEmail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {!showReset ? (
                      <form onSubmit={handleEmail} className="space-y-2.5 pt-1">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowReset(true)}
                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.985 }}
                          type="submit"
                          disabled={busy}
                          className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)' }}
                        >
                          {loading === 'email'
                            ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                            : 'Sign in'
                          }
                        </motion.button>

                        {/* Unconfirmed email error */}
                        <AnimatePresence>
                          {emailError === 'unconfirmed' && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2"
                            >
                              <p className="text-xs text-amber-700 dark:text-amber-400">
                                Wrong password, or your email isn't confirmed yet.
                              </p>
                              <button
                                type="button"
                                onClick={handleResend}
                                disabled={busy}
                                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
                              >
                                {loading === 'resend'
                                  ? 'Sending…'
                                  : 'Resend confirmation email →'
                                }
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </form>
                    ) : (
                      <form onSubmit={handleReset} className="space-y-2.5 pt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Enter your email and we'll send a reset link.</p>
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.06] text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setShowReset(false)} className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-white/[0.1] text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all">
                            Back
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.985 }}
                            type="submit"
                            disabled={busy}
                            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)' }}
                          >
                            {loading === 'reset' ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Send link'}
                          </motion.button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OR divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
                <span className="text-[11px] text-gray-400 font-medium">OR</span>
                <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
              </div>

              {/* Demo accounts */}
              <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
                Try without signing up
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { loginAsCreator(); toast.success('Creator demo loaded'); }}
                  disabled={busy}
                  className="h-10 rounded-xl text-xs font-medium bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 transition-all disabled:opacity-40"
                >
                  Creator Demo
                </button>
                <button
                  onClick={() => { loginAsBrand(); toast.success('Brand demo loaded'); }}
                  disabled={busy}
                  className="h-10 rounded-xl text-xs font-medium bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 transition-all disabled:opacity-40"
                >
                  Brand Demo
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
              New here?{' '}
              <Link to="/signup" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
