import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Shield, LogOut, ChevronRight, Trash2, X,
  Eye, EyeOff, Lock, AlertTriangle, CreditCard,
  BellRing, UserCog, User, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import SubscriptionBilling from '../../components/SubscriptionBilling';
import { supabase } from '../../supabaseClient';

const TABS = [
  { id: 'notifs',  label: 'Notifications', icon: BellRing },
  { id: 'billing', label: 'Billing',        icon: CreditCard },
  { id: 'account', label: 'Account',        icon: UserCog },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${checked ? 'bg-creator' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function CreatorSettings() {
  const { user, logout, darkMode, toggleDark } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('notifs');

  const [notifs, setNotifs] = useState({
    newOrder: true, messages: true, payments: true, campaigns: true, marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    showRates: true, showEarnings: false, allowDMs: true,
  });

  /* Security */
  const [showSecurity, setShowSecurity] = useState(false);
  const [pwForm, setPwForm]     = useState({ newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw]     = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  /* Delete */
  const [showDelete, setShowDelete]   = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting]       = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setShowSecurity(false);
      setPwForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    try {
      await supabase.from('creator_profiles').update({ deleted_at: new Date().toISOString() }).eq('id', user.id).catch(() => {});
      await logout();
      toast.success('Account deleted.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const Row = ({ icon: Icon, label, desc, right, danger }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Icon size={14} className={danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
          </div>
        )}
        <div>
          <p className={`text-sm font-medium ${danger ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>{label}</p>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">{right}</div>
    </div>
  );

  return (
    <DashboardLayout>
      <SEO title="Settings" noindex={true} />

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-800 shadow" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-creator flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-creator/10 text-creator mt-1">Creator</span>
          </div>
          <button onClick={() => navigate('/creator/profile/edit')} className="btn btn-outline btn-sm flex-shrink-0 gap-1.5">
            <User size={13} /> Edit Profile
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-2xl mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === t.id
                  ? 'bg-white dark:bg-gray-900 text-creator shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <t.icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === 'notifs' && (
          <motion.div key="notifs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Notifications</h2>
              <p className="text-xs text-gray-400 mb-5">Choose which alerts you receive</p>
              <Row label="New Orders" desc="When a brand places an order" right={<Toggle checked={notifs.newOrder} onChange={v => setNotifs(n => ({ ...n, newOrder: v }))} />} />
              <Row label="Messages" desc="New messages from brands" right={<Toggle checked={notifs.messages} onChange={v => setNotifs(n => ({ ...n, messages: v }))} />} />
              <Row label="Payments" desc="Earnings and wallet activity" right={<Toggle checked={notifs.payments} onChange={v => setNotifs(n => ({ ...n, payments: v }))} />} />
              <Row label="Campaign Matches" desc="New campaigns matching your profile" right={<Toggle checked={notifs.campaigns} onChange={v => setNotifs(n => ({ ...n, campaigns: v }))} />} />
              <Row label="Marketing Emails" desc="Tips, news, and OgisBack updates" right={<Toggle checked={notifs.marketing} onChange={v => setNotifs(n => ({ ...n, marketing: v }))} />} />
            </div>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Privacy</h2>
              <p className="text-xs text-gray-400 mb-5">Control what others can see</p>
              <Row label="Show Rates Publicly" desc="Brands can see your rate card" right={<Toggle checked={privacy.showRates} onChange={v => setPrivacy(p => ({ ...p, showRates: v }))} />} />
              <Row label="Show Earnings" desc="Display completed orders on profile" right={<Toggle checked={privacy.showEarnings} onChange={v => setPrivacy(p => ({ ...p, showEarnings: v }))} />} />
              <Row label="Allow Direct Messages" desc="Brands can message you directly" right={<Toggle checked={privacy.allowDMs} onChange={v => setPrivacy(p => ({ ...p, allowDMs: v }))} />} />
            </div>
            <div className="card p-6">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
              <p className="text-xs text-gray-400 mb-5">Customize the look</p>
              <Row icon={Moon} label="Dark Mode" desc="Easier on the eyes in low light" right={<Toggle checked={darkMode} onChange={toggleDark} />} />
            </div>
          </motion.div>
        )}

        {/* ── BILLING TAB ── */}
        {activeTab === 'billing' && (
          <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Subscription & Billing</h2>
              <p className="text-xs text-gray-400 mb-5">Manage your plan and earnings</p>
              <SubscriptionBilling role="creator" />
            </div>
            <div className="card p-6">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Payout Methods</h2>
              <p className="text-xs text-gray-400 mb-5">Manage where you receive your earnings</p>
              <Row
                icon={CreditCard}
                label="Withdrawal Accounts"
                desc="Add or manage bank accounts & wallets"
                right={
                  <button onClick={() => navigate('/creator/withdraw')} className="flex items-center gap-1 text-sm text-creator font-medium hover:text-creator-600 transition-colors">
                    Manage <ChevronRight size={14} />
                  </button>
                }
              />
            </div>
          </motion.div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Security</h2>
              <p className="text-xs text-gray-400 mb-5">Keep your account safe</p>
              <Row
                icon={Shield}
                label="Change Password"
                desc="Update your login password"
                right={
                  <button onClick={() => setShowSecurity(true)} className="flex items-center gap-1 text-sm text-creator font-medium hover:text-creator-600 transition-colors">
                    Update <ChevronRight size={14} />
                  </button>
                }
              />
            </div>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Danger Zone</h2>
              <p className="text-xs text-gray-400 mb-5">Irreversible actions</p>
              <Row
                icon={Trash2}
                label="Delete Account"
                desc="Permanently delete your account and all data"
                danger
                right={
                  <button onClick={() => { setDeleteInput(''); setShowDelete(true); }} className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors">
                    Delete
                  </button>
                }
              />
            </div>
            <button onClick={handleLogout} className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 btn-lg w-full">
              <LogOut size={17} /> Sign Out
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Security Modal ── */}
      <AnimatePresence>
        {showSecurity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !pwSaving && setShowSecurity(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-creator/10 flex items-center justify-center"><Lock size={14} className="text-creator" /></div>
                  <h2 className="font-heading font-bold text-gray-900 dark:text-white">Change Password</h2>
                </div>
                <button onClick={() => setShowSecurity(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="At least 8 characters" className="input pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Confirm Password</label>
                  <input type={showPw ? 'text' : 'password'} value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat your password" className="input" />
                  {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowSecurity(false)} disabled={pwSaving} className="btn btn-outline btn-md flex-1">Cancel</button>
                <button onClick={handlePasswordChange} disabled={pwSaving || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirmPassword} className="btn btn-creator btn-md flex-1 disabled:opacity-60">
                  {pwSaving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</span> : 'Update Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Modal ── */}
      <AnimatePresence>
        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setShowDelete(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertTriangle size={14} className="text-red-500" /></div>
                  <h2 className="font-heading font-bold text-gray-900 dark:text-white">Delete Account</h2>
                </div>
                <button onClick={() => setShowDelete(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-5">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-1">This is permanent</p>
                <p className="text-xs text-red-600/80 dark:text-red-500/80 leading-relaxed">Your profile, posts, earnings history, and all account data will be permanently deleted. Active orders will be cancelled.</p>
              </div>
              <div className="form-group mb-5">
                <label className="label">Type <span className="font-bold text-red-500">DELETE</span> to confirm</label>
                <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="DELETE" className="input border-red-200 dark:border-red-800" autoComplete="off" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(false)} disabled={deleting} className="btn btn-outline btn-md flex-1">Cancel</button>
                <button onClick={handleDeleteAccount} disabled={deleteInput !== 'DELETE' || deleting} className="btn btn-md flex-1 bg-red-500 hover:bg-red-600 text-white disabled:opacity-40">
                  {deleting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span> : 'Delete Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
