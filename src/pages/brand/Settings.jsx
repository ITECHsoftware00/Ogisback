import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Moon, Bell, Shield, LogOut, ChevronRight, Building2, Globe,
  Trash2, CheckCircle, Crown, Star, Zap, MapPin, FileText,
  Users, Info, ArrowRight, Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

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

  const [notifs, setNotifs] = useState({
    applications: true, messages: true, orderUpdates: true, marketing: false,
  });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    industry: '',
    website: '',
    description: '',
    size: '',
    location: '',
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Brand name is required');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    completeProfile();
    toast.success(isSetup ? 'Profile complete! Welcome to OgisBack.' : 'Settings saved successfully.');
    if (isSetup) navigate('/brand/discover');
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
                src={user?.logo || 'https://i.pravatar.cc/150?img=20'}
                alt="Brand logo"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"
              />
              <button
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center shadow"
                title="Change logo"
                onClick={() => toast('Logo upload coming soon')}
              >
                <Camera size={11} />
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Your Brand'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Brand Account</p>
              <button
                className="btn btn-outline btn-sm mt-2 text-xs"
                onClick={() => toast('Logo upload coming soon')}
              >
                Change Logo
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
              title="Subscription Plan"
              subtitle="Your current plan determines campaign limits and platform fees."
            >
              <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${
                plan === 'max'
                  ? 'bg-primary/5 border border-primary/20'
                  : plan === 'mini'
                  ? 'bg-brand/5 border border-brand/20'
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan === 'max' ? 'bg-primary/10' : plan === 'mini' ? 'bg-brand/10' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {plan === 'max'
                      ? <Crown size={18} className="text-primary" />
                      : plan === 'mini'
                      ? <Star size={18} className="text-brand" />
                      : <Zap size={18} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {plan === 'free' ? 'Free Plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {plan === 'max'
                        ? '10% platform fee · Unlimited campaigns · Dedicated account manager'
                        : plan === 'mini'
                        ? '15% platform fee · Up to 10 campaigns · Priority creator matching'
                        : '20% platform fee · Up to 2 campaigns · Standard support'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className={`btn btn-sm ${plan === 'free' ? 'btn-brand' : 'btn-outline'}`}
                >
                  {plan === 'free' ? 'Upgrade' : 'Manage'}
                </button>
              </div>
              {plan !== 'max' && (
                <div className="bg-gradient-to-r from-brand/5 to-teal-50 dark:to-teal-900/10 rounded-xl p-4 flex items-start gap-3 border border-brand/10">
                  <Crown size={16} className="text-brand mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Unlock the Max Plan</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Run unlimited campaigns, access the AI negotiation agent, get a dedicated account manager, and pay only 10% per deal — all for $149/month.
                    </p>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="text-xs font-bold text-brand mt-2 hover:underline flex items-center gap-1"
                    >
                      Compare all plans <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              )}
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
                label="Security Settings"
                desc="Manage your password, two-factor authentication, and connected accounts."
                right={
                  <button
                    onClick={() => toast.success('Security settings coming soon')}
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
    </DashboardLayout>
  );
}
