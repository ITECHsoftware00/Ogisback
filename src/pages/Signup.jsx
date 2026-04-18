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
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, loginAsCreator, loginAsBrand, isLoggedIn, activeRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [role, setRole] = useState('creator');
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

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

  const passwordRules = [
    { key: 'length',    label: 'At least 8 characters',          test: p => p.length >= 8 },
    { key: 'lower',     label: 'One lowercase letter (a–z)',      test: p => /[a-z]/.test(p) },
    { key: 'upper',     label: 'One uppercase letter (A–Z)',      test: p => /[A-Z]/.test(p) },
    { key: 'number',    label: 'One number (0–9)',                test: p => /[0-9]/.test(p) },
    { key: 'special',   label: 'One special character (!@#$…)',   test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(p) },
  ];
  const passwordChecks = passwordRules.map(r => ({ ...r, passed: r.test(password) }));
  const passwordValid  = passwordChecks.every(r => r.passed);

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!passwordValid) { toast.error('Please meet all password requirements.'); return; }
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }
    setLoading('email');

    const tryAutoLogin = async () => {
      try {
        await signInWithEmail(email, password);
        // onAuthStateChange fires → navigates automatically
      } catch {
        toast.success('Account created! Check your email to confirm before signing in.');
        setLoading(null);
      }
    };

    try {
      await signUpWithEmail(email, password, role);
      await tryAutoLogin();
    } catch (err) {
      if (err.message?.toLowerCase().includes('sending confirmation email')) {
        // Account was created but email sending failed — still try to sign in
        await tryAutoLogin();
      } else if (err.message?.toLowerCase().includes('already registered')) {
        toast.error('An account with this email already exists. Try signing in.');
        setLoading(null);
      } else {
        toast.error(err.message || 'Sign-up failed.');
        setLoading(null);
      }
    }
  };

  const busy = !!loading;

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
                  disabled={busy}
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

              {/* Email toggle */}
              <button
                type="button"
                onClick={() => setShowEmail(v => !v)}
                disabled={busy}
                className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] text-gray-800 dark:text-gray-200 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-white/[0.1] disabled:opacity-50 transition-all"
              >
                <svg className="w-5 h-5 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Continue with email</span>
              </button>

              {/* Expandable email sign-up form */}
              <AnimatePresence>
                {showEmail && (
                  <motion.form
                    onSubmit={handleEmail}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-2.5 pt-1"
                  >
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
                      className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-white/[0.06] text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                        password && !passwordValid
                          ? 'border-amber-300 dark:border-amber-700'
                          : password && passwordValid
                          ? 'border-emerald-400 dark:border-emerald-600'
                          : 'border-gray-200 dark:border-white/[0.1]'
                      }`}
                    />

                    {/* Live password requirements */}
                    {password && (
                      <div className="rounded-xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] p-3 space-y-1.5">
                        {passwordChecks.map(rule => (
                          <div key={rule.key} className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              rule.passed
                                ? 'bg-emerald-100 dark:bg-emerald-900/40'
                                : 'bg-gray-100 dark:bg-white/[0.05]'
                            }`}>
                              {rule.passed
                                ? <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                : <svg className="w-2.5 h-2.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                              }
                            </span>
                            <span className={`text-xs transition-colors ${
                              rule.passed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-white/[0.06] text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
                        confirm && confirm !== password
                          ? 'border-red-300 dark:border-red-700'
                          : confirm && confirm === password
                          ? 'border-emerald-400 dark:border-emerald-600'
                          : 'border-gray-200 dark:border-white/[0.1]'
                      }`}
                    />
                    {confirm && confirm !== password && (
                      <p className="text-xs text-red-500 dark:text-red-400 -mt-1">Passwords do not match</p>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      disabled={busy || !passwordValid || confirm !== password}
                      className="w-full h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)' }}
                    >
                      {loading === 'email'
                        ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                        : `Create ${roles[role].label} account`
                      }
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* OR divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
                <span className="text-[11px] text-gray-400 font-medium">OR</span>
                <div className="h-px flex-1 bg-gray-100 dark:bg-white/[0.06]" />
              </div>

              {/* Demo buttons */}
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
