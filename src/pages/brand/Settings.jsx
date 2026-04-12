import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Bell, Shield, LogOut, ChevronRight, Building2, Globe,
  Trash2, CheckCircle, Crown, Star, Zap, MapPin, FileText,
  Users, Info, ArrowRight, Camera, X, Eye, EyeOff, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { updateBrandProfile } from '../../lib/db';
import { uploadLogo } from '../../lib/storage';
import { supabase } from '../../supabaseClient';
import SubscriptionBilling from '../../components/SubscriptionBilling';

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all ${checked ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function FieldHint({ children }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-gray-400 mt-1.5">
      <Info size={12} className="mt-0.5 flex-shrink-0" />
      {children}
    </p>
  );
}

const industries = [
  'Beauty & Skincare', 'Electronics & Tech', 'Fitness & Health',
  'Fashion & Apparel', 'Food & Nutrition', 'Travel & Lifestyle',
  'Finance & Fintech', 'Education & E-Learning', 'Gaming & Entertainment', 'Other',
];
const sizes = ['1–10', '11–50', '51–200', '201–500', '500+'];

const SETUP_STEPS = ['Brand Identity', 'About Your Brand', 'Campaign Preferences'];

export default function BrandSettings() {
  const { user, logout, darkMode, toggleDark, completeProfile, plan } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isSetup = params.get('setup') === 'true';
  const logoInputRef = useRef(null);

  const [notifs, setNotifs] = useState({
    applications: true, messages: true, orderUpdates: true, marketing: false,
  });
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(user?.logo || null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    industry: '',
    website: '',
    description: '',
    size: '',
    location: '',
  });

  // Security modal
  const [showSecurity, setShowSecurity] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

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
        size: form.size || null,
        location: form.location || null,
      });
      await completeProfile();
      toast.success(isSetup ? 'Profile complete! Welcome to OgisBack.' : 'Settings saved successfully.');
      if (isSetup) navigate('/brand/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to save. Please try again.');
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
      toast.success('Password updated successfully');
      setShowSecurity(false);
      setPwForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const Section = ({ title, subtitle, children }) => (
    <div className="card p-6 mb-5">
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );

  const SettingRow = ({ icon: Icon, label, desc, right }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Icon size={14} className="text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">{right}</div>
    </div>
  );

  return (
    <DashboardLayout>
      <SEO title="Brand Settings" noindex={true} />

      {/* Hidden file input for logo upload */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />

      <div className="max-w-2xl mx-auto">

        {/* ── Setup welcome banner ── */}
        {isSetup && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-brand text-white p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg mb-1">Let's set up your brand profile</h2>
                <p className="text-white/80 text-sm leading-relaxed">
                  Your profile is what creators see when you reach out or post a campaign.
                  A complete profile gets <strong className="text-white">3× more responses</strong> from top creators.
                </p>
              </div>
            </div>

            {/* Progress steps */}
            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/20">
              {SETUP_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-white text-brand' : 'bg-white/20 text-white/60'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-medium truncate ${i === 0 ? 'text-white' : 'text-white/50'}`}>{step}</span>
                  {i < SETUP_STEPS.length - 1 && <div className="h-px flex-1 bg-white/20 mx-1" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Page header ── */}
        <div className="mb-6">
          <h1 className="page-title">{isSetup ? 'Brand Profile Setup' : 'Account Settings'}</h1>
          <p className="page-subtitle mt-1">
            {isSetup
              ? 'Fill in your brand details so creators know who they\'re working with.'
              : 'Manage your brand profile, preferences, and account settings.'}
          </p>
        </div>

        {/* ── Brand Profile Form ── */}
        <Section
          title="Brand Identity"
          subtitle="This information appears on your public profile and in campaign listings."
        >
          {/* Logo row */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="relative">
              <img
                src={logoUrl || 'https://i.pravatar.cc/150?img=20'}
                alt="Brand logo"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
              />
              <button
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center shadow disabled:opacity-60"
                title="Change logo"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUploading
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Camera size={11} />}
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Your Brand'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Brand Account</p>
              <button
                className="btn btn-outline btn-sm mt-2 text-xs disabled:opacity-60"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUploading ? 'Uploading...' : 'Change Logo'}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* Brand Name */}
            <div className="form-group">
              <label className="label">
                Brand Name <span className="text-red-400 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="e.g. NovaSkin, TechFlow Pro"
                  className="input pl-9"
                />
              </div>
              <FieldHint>This is the name creators will see when browsing campaigns and receiving your messages.</FieldHint>
            </div>

            {/* Industry */}
            <div className="form-group">
              <label className="label">Industry</label>
              <select
                value={form.industry}
                onChange={e => update('industry', e.target.value)}
                className="input appearance-none cursor-pointer"
              >
                <option value="">Select your industry...</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <FieldHint>Helps OgisBack recommend the most relevant creators for your campaigns.</FieldHint>
            </div>

            {/* Website */}
            <div className="form-group">
              <label className="label">Website</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.website}
                  onChange={e => update('website', e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="input pl-9"
                />
              </div>
              <FieldHint>Optional but recommended — a website increases creator confidence in your brand.</FieldHint>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="label">Brand Description</label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-3.5 text-gray-400" />
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Describe your brand, what you sell, and the type of audience you're targeting. Creators read this before deciding to work with you."
                  rows={4}
                  className="input pl-9 resize-none"
                />
              </div>
              <FieldHint>A clear description helps creators assess whether your brand is a good fit for their audience.</FieldHint>
            </div>

            {/* Size & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Company Size</label>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={form.size}
                    onChange={e => update('size', e.target.value)}
                    className="input pl-9 appearance-none cursor-pointer"
                  >
                    <option value="">Select size...</option>
                    {sizes.map(s => <option key={s}>{s} employees</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                    placeholder="City, Country"
                    className="input pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
            {isSetup && (
              <p className="text-xs text-gray-400 mb-4 flex items-start gap-1.5">
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                You can always update these details later from your Settings page.
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-brand btn-lg w-full disabled:opacity-60"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving your profile...
                </span>
              ) : isSetup ? (
                <>
                  <CheckCircle size={17} />
                  Complete Setup &amp; Go to Marketplace
                  <ArrowRight size={16} />
                </>
              ) : (
                <><CheckCircle size={17} /> Save Changes</>
              )}
            </button>
          </div>
        </Section>

        {/* ── Non-setup sections ── */}
        {!isSetup && (
          <>
            {/* Subscription */}
            <Section
              title="Subscription & Billing"
              subtitle="Manage your plan, view billing history, and update your payment method."
            >
              <SubscriptionBilling role="brand" />
            </Section>

            {/* Appearance */}
            <Section title="Appearance" subtitle="Customize how the platform looks for you.">
              <SettingRow
                icon={Moon}
                label="Dark Mode"
                desc="Switches the platform to a darker color scheme, easier on the eyes in low light."
                right={<Toggle checked={darkMode} onChange={toggleDark} />}
              />
            </Section>

            {/* Notifications */}
            <Section
              title="Notification Preferences"
              subtitle="Choose which activity alerts you receive from OgisBack."
            >
              <SettingRow
                label="Creator Applications"
                desc="Get notified when a creator applies to one of your active campaigns."
                right={<Toggle checked={notifs.applications} onChange={v => setNotifs(n => ({ ...n, applications: v }))} />}
              />
              <SettingRow
                label="New Messages"
                desc="Receive alerts when a creator sends you a message."
                right={<Toggle checked={notifs.messages} onChange={v => setNotifs(n => ({ ...n, messages: v }))} />}
              />
              <SettingRow
                label="Order Updates"
                desc="Stay informed on deliveries, revision requests, and approvals."
                right={<Toggle checked={notifs.orderUpdates} onChange={v => setNotifs(n => ({ ...n, orderUpdates: v }))} />}
              />
              <SettingRow
                label="Platform News & Tips"
                desc="Occasional emails about new features, best practices, and OgisBack announcements."
                right={<Toggle checked={notifs.marketing} onChange={v => setNotifs(n => ({ ...n, marketing: v }))} />}
              />
            </Section>

            {/* Account */}
            <Section title="Account & Security" subtitle="Manage your login security and account data.">
              <SettingRow
                icon={Shield}
                label="Change Password"
                desc="Update your password to keep your account secure."
                right={
                  <button
                    onClick={() => setShowSecurity(true)}
                    className="text-brand hover:text-brand-600 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                }
              />
              <SettingRow
                icon={Trash2}
                label="Delete Account"
                desc="Permanently remove your brand account and all associated data. This action cannot be undone."
                right={
                  <button
                    onClick={() => toast.error('Please contact support to delete your account.')}
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                }
              />
            </Section>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 btn-lg w-full mb-6 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <LogOut size={18} /> Sign Out of OgisBack
            </button>
          </>
        )}
      </div>

      {/* ── Security / Password Modal ── */}
      <AnimatePresence>
        {showSecurity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !pwSaving && setShowSecurity(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-[#111118] rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Lock size={15} className="text-brand" />
                  </div>
                  <h2 className="font-heading font-bold text-gray-900 dark:text-white">Change Password</h2>
                </div>
                <button onClick={() => setShowSecurity(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="At least 8 characters"
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Repeat your new password"
                    className="input"
                  />
                  {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowSecurity(false)} className="btn btn-outline btn-md flex-1" disabled={pwSaving}>Cancel</button>
                <button onClick={handlePasswordChange} disabled={pwSaving} className="btn btn-brand btn-md flex-1 disabled:opacity-60">
                  {pwSaving ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</span>
                  ) : 'Update Password'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
