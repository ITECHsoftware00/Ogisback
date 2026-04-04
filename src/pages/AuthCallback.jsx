import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setupOAuthProfile } = useAuth();

  const [step, setStep] = useState('loading'); // 'loading' | 'role-select'
  const [session, setSession] = useState(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!sess) {
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
        return;
      }
      setSession(sess);

      // Prefill name from provider metadata
      const providerName =
        sess.user.user_metadata?.full_name ||
        sess.user.user_metadata?.name ||
        sess.user.user_metadata?.user_name ||
        '';
      setName(providerName);

      // Check if this user already has a profile
      supabase
        .from('profiles')
        .select('id, role')
        .eq('id', sess.user.id)
        .single()
        .then(async ({ data: profile }) => {
          if (profile) {
            // Existing user — send to dashboard
            localStorage.removeItem('ogisback_pending_role');
            navigate(
              profile.role === 'creator' ? '/creator/dashboard' : '/brand/discover',
              { replace: true }
            );
          } else {
            // New OAuth user — check if role was pre-selected on signup/login page
            const pendingRole = localStorage.getItem('ogisback_pending_role');
            if (pendingRole) {
              localStorage.removeItem('ogisback_pending_role');
              // Auto-setup with the pre-selected role, then go to profile setup
              try {
                const displayName =
                  sess.user.user_metadata?.full_name ||
                  sess.user.user_metadata?.name ||
                  sess.user.user_metadata?.user_name ||
                  sess.user.email.split('@')[0];
                await setupOAuthProfile(sess.user.id, sess.user.email, pendingRole, displayName);
                toast.success('Account created! Let\'s set up your profile.');
                navigate(
                  pendingRole === 'creator' ? '/creator/profile/edit?setup=true' : '/brand/settings?setup=true',
                  { replace: true }
                );
              } catch {
                setStep('role-select');
              }
            } else {
              // No pre-selected role — show picker
              setStep('role-select');
            }
          }
        });
    });
  }, []);

  const handleRoleSelect = async (role) => {
    if (!name.trim()) {
      toast.error('Please enter your name first');
      return;
    }
    setSubmitting(true);
    try {
      await setupOAuthProfile(session.user.id, session.user.email, role, name.trim());
      toast.success('Account ready! Setting up your profile…');
      navigate(
        role === 'creator' ? '/creator/profile/edit?setup=true' : '/brand/settings?setup=true',
        { replace: true }
      );
    } catch (err) {
      toast.error(err.message || 'Setup failed. Please try again.');
      setSubmitting(false);
    }
  };

  /* ── Loading spinner ── */
  if (step === 'loading') {
    return (
      <div
 className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0F] gap-4">
      <SEO title="Signing in…" noindex={true} />
        <div className="w-14 h-14 rounded-2xl bg-gradient-creator flex items-center justify-center shadow-glow-creator mb-2">
          <span className="text-white font-heading font-bold text-xl">O</span>
        </div>
        <div className="w-10 h-10 border-4 border-creator/20 border-t-creator rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    );
  }

  /* ── Role selection for new OAuth users ── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0F] p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-creator flex items-center justify-center mx-auto mb-4 shadow-glow-creator">
            <span className="text-white font-heading font-bold text-lg">O</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-1">One last step</h1>
          <p className="text-gray-500 text-sm">Tell us who you are to finish setting up your account.</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Name input */}
          <div className="form-group">
            <label className="label">Your name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="input pl-9"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Role picker */}
          <div>
            <label className="label mb-3 block">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRoleSelect('creator')}
                disabled={submitting}
                className="group p-4 rounded-2xl border-2 border-creator/20 bg-creator/5 hover:bg-creator/10 hover:border-creator/40 text-left transition-all disabled:opacity-60"
              >
                <div className="text-3xl mb-2">🎬</div>
                <div className="font-heading font-bold text-gray-900 dark:text-white text-sm">Creator</div>
                <div className="text-xs text-gray-500 mt-0.5">I create content</div>
              </button>

              <button
                onClick={() => handleRoleSelect('brand')}
                disabled={submitting}
                className="group p-4 rounded-2xl border-2 border-brand/20 bg-brand/5 hover:bg-brand/10 hover:border-brand/40 text-left transition-all disabled:opacity-60"
              >
                <div className="text-3xl mb-2">🏢</div>
                <div className="font-heading font-bold text-gray-900 dark:text-white text-sm">Brand</div>
                <div className="text-xs text-gray-500 mt-0.5">I hire creators</div>
              </button>
            </div>
          </div>

          {submitting && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-1">
              <div className="w-4 h-4 border-2 border-creator/30 border-t-creator rounded-full animate-spin" />
              Setting up your account…
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to OgisBack's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
