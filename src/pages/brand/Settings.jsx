import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Bell, Shield, LogOut, ChevronRight, Building2, Globe,
  Trash2, CheckCircle, MapPin, FileText, Users, Info,
  ArrowRight, Camera, X, Eye, EyeOff, Lock, AlertTriangle,
  CreditCard, Palette, BellRing, UserCog,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { updateBrandProfile, getBrandProfile } from '../../lib/db';
import { uploadLogo } from '../../lib/storage';
import { supabase } from '../../supabaseClient';
import SubscriptionBilling from '../../components/SubscriptionBilling';

const industries = [
  'Beauty & Skincare','Electronics & Tech','Fitness & Health','Fashion & Apparel',
  'Food & Nutrition','Travel & Lifestyle','Finance & Fintech','Education & E-Learning',
  'Gaming & Entertainment','Other',
];
const sizes = ['1–10','11–50','51–200','201–500','500+'];

function Toggle({ checked, onChange, color = 'bg-brand' }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${checked ? color : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

const TABS = [
  { id: 'profile',  label: 'Profile',       icon: Building2 },
  { id: 'notifs',   label: 'Notifications', icon: BellRing },
  { id: 'billing',  label: 'Billing',       icon: CreditCard },
  { id: 'account',  label: 'Account',       icon: UserCog },
];

export default function BrandSettings() {
  const { user, logout, darkMode, toggleDark, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isSetup = params.get('setup') === 'true';
  const logoInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(user?.logo || null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [form, setForm] = useState({ name: '', industry: '', website: '', description: '', company_size: '', location: '' });
  const [notifs, setNotifs] = useState({ applications: true, messages: true, orderUpdates: true, marketing: false });

  /* Security */
  const [showSecurity, setShowSecurity] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  /* Delete */
  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) { setProfileLoading(false); return; }
    getBrandProfile(user.id)
      .then(p => {
        if (!p) return;
        if (p.logo_url) setLogoUrl(p.logo_url);
        setForm({
          name: p.name || '',
          industry: p.industry || '',
          website: p.website || '',
          description: p.description || '',
          company_size: p.company_size || '',
          location: p.location || '',
        });
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [user?.id]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setLogoUploading(true);
    try {
      const url = await uploadLogo(user.id, file);
      await updateBrandProfile(user.id, { logo_url: url });
      setLogoUrl(url);
      toast.success('Logo updated');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Brand name is required'); return; }
    setSaving(true);
    try {
      await updateBrandProfile(user.id, {
        name: form.name.trim(),
        industry: form.industry || null,
        website: form.website || null,
        description: form.description || null,
        company_size: form.company_size || null,
        location: form.location || null,
      });
      await completeProfile();
      toast.success(isSetup ? 'Profile complete! Welcome to OgisBack.' : 'Changes saved.');
      if (isSetup) navigate('/brand/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

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
      await supabase.from('brand_profiles').update({ deleted_at: new Date().toISOString() }).eq('id', user.id).catch(() => {});
      await logout();
      toast.success('Account deleted.');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <span className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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
      <SEO title="Brand Settings" noindex={true} />
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="page-title">{isSetup ? 'Brand Profile Setup' : 'Settings'}</h1>
          <p className="page-subtitle">{isSetup ? 'Set up your brand so creators know who they\'re working with.' : 'Manage your brand profile, notifications, and account.'}</p>
        </div>

        {/* Profile card */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'B')}&background=0D9488&color=fff&size=56`}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-800 shadow"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center shadow disabled:opacity-60"
            >
              {logoUploading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={11} />}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-gray-900 dark:text-white truncate">{form.name || user?.name}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand mt-1">Brand</span>
          </div>
        </div>

        {/* Tabs (hidden in setup mode) */}
        {!isSetup && (
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-2xl mb-6">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-gray-900 text-brand shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <t.icon size={13} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {(isSetup || activeTab === 'profile') && (
          <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-5">Brand Identity</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Brand Name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. NovaSkin" className="input pl-9" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Industry</label>
                  <select value={form.industry} onChange={e => update('industry', e.target.value)} className="input appearance-none cursor-pointer">
                    <option value="">Select industry...</option>
                    {industries.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Website</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://yourbrand.com" className="input pl-9" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="What does your brand sell? Who's your target audience?" className="input resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="label">Company Size</label>
                    <div className="relative">
                      <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select value={form.company_size} onChange={e => update('company_size', e.target.value)} className="input pl-9 appearance-none cursor-pointer">
                        <option value="">Select...</option>
                        {sizes.map(s => <option key={s}>{s} employees</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Location</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="City, Country" className="input pl-9" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                <button onClick={handleSave} disabled={saving} className="btn btn-brand btn-lg w-full disabled:opacity-60">
                  {saving ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                  ) : isSetup ? <><CheckCircle size={16} /> Complete Setup <ArrowRight size={15} /></> : <><CheckCircle size={16} /> Save Changes</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {!isSetup && activeTab === 'notifs' && (
          <motion.div key="notifs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Notifications</h2>
              <p className="text-xs text-gray-400 mb-5">Choose which alerts you receive</p>
              <Row label="Creator Applications" desc="When a creator applies to your campaigns" right={<Toggle checked={notifs.applications} onChange={v => setNotifs(n => ({ ...n, applications: v }))} />} />
              <Row label="New Messages" desc="When a creator sends you a message" right={<Toggle checked={notifs.messages} onChange={v => setNotifs(n => ({ ...n, messages: v }))} />} />
              <Row label="Order Updates" desc="Deliveries, revisions, and approvals" right={<Toggle checked={notifs.orderUpdates} onChange={v => setNotifs(n => ({ ...n, orderUpdates: v }))} />} />
              <Row label="Platform News" desc="Tips, features, and OgisBack updates" right={<Toggle checked={notifs.marketing} onChange={v => setNotifs(n => ({ ...n, marketing: v }))} />} />
            </div>
            <div className="card p-6">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Appearance</h2>
              <p className="text-xs text-gray-400 mb-5">Customize how the app looks</p>
              <Row icon={Moon} label="Dark Mode" desc="Easier on the eyes in low light" right={<Toggle checked={darkMode} onChange={toggleDark} />} />
            </div>
          </motion.div>
        )}

        {/* ── BILLING TAB ── */}
        {!isSetup && activeTab === 'billing' && (
          <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-6">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Subscription & Billing</h2>
              <p className="text-xs text-gray-400 mb-5">Manage your plan and payment method</p>
              <SubscriptionBilling role="brand" />
            </div>
          </motion.div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {!isSetup && activeTab === 'account' && (
          <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card p-6 mb-4">
              <h2 className="font-heading font-semibold text-gray-900 dark:text-white mb-1">Security</h2>
              <p className="text-xs text-gray-400 mb-5">Keep your account safe</p>
              <Row
                icon={Shield}
                label="Change Password"
                desc="Update your login password"
                right={
                  <button onClick={() => setShowSecurity(true)} className="flex items-center gap-1 text-sm text-brand font-medium hover:text-brand-600 transition-colors">
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
                desc="Permanently delete your brand and all data"
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
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Lock size={14} className="text-brand" /></div>
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
                <button onClick={handlePasswordChange} disabled={pwSaving || !pwForm.newPassword || pwForm.newPassword !== pwForm.confirmPassword} className="btn btn-brand btn-md flex-1 disabled:opacity-60">
                  {pwSaving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</span> : 'Update Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Account Modal ── */}
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
                <p className="text-xs text-red-600/80 dark:text-red-500/80 leading-relaxed">Your brand profile, campaigns, wallet balance, and all associated data will be permanently erased. Active orders will be cancelled.</p>
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
