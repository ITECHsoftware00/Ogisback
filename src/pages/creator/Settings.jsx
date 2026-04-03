import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Moon, Trash2, LogOut, ChevronRight, User, CreditCard, Crown, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-all ${checked ? 'bg-creator' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export default function CreatorSettings() {
  const { user, logout, darkMode, toggleDark, plan } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState({ newOrder: true, messages: true, payments: true, campaigns: true, marketing: false });
  const [privacy, setPrivacy] = useState({ showRates: true, showEarnings: false, allowDMs: true });

  const handleLogout = () => { logout(); navigate('/'); };

  const Section = ({ title, children }) => (
    <div className="card p-6 mb-4">
      <h2 className="section-title">{title}</h2>
      {children}
    </div>
  );

  const SettingRow = ({ icon: Icon, label, desc, right }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={16} className="text-gray-400" />}
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
          {desc && <p className="text-xs text-gray-400">{desc}</p>}
        </div>
      </div>
      {right}
    </div>
  );

  return (
    <DashboardLayout>
      <SEO title="Settings" noindex={true} />
      <div className="max-w-xl mx-auto">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>

        {/* Profile summary */}
        <div className="card p-5 mb-4 flex items-center gap-4">
          <img src={user?.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover" />
          <div className="flex-1">
            <p className="font-heading font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge badge-creator mt-1">Creator Account</span>
          </div>
          <button onClick={() => navigate('/creator/profile/edit')} className="btn btn-outline btn-sm">
            <User size={13} /> Edit Profile
          </button>
        </div>

        {/* Subscription */}
        <div className="card p-6 mb-4">
          <h2 className="section-title">Subscription</h2>
          <div className={`flex items-center justify-between p-4 rounded-2xl mb-4 ${plan === 'max' ? 'bg-primary/5 border border-primary/20' : plan === 'mini' ? 'bg-creator/5 border border-creator/20' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan === 'max' ? 'bg-primary/10' : plan === 'mini' ? 'bg-creator/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {plan === 'max' ? <Crown size={18} className="text-primary" /> : plan === 'mini' ? <Star size={18} className="text-creator" /> : <Zap size={18} className="text-gray-400" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{plan === 'free' ? 'Free Plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}</p>
                <p className="text-xs text-gray-500">{plan === 'max' ? '15% fee · Unlimited posts · Featured listing' : plan === 'mini' ? '18% fee · 50 posts · Priority listing' : '20% fee · 5 posts/mo · Standard listing'}</p>
              </div>
            </div>
            <button onClick={() => navigate('/pricing')} className={`btn btn-sm ${plan === 'free' ? 'btn-primary' : 'btn-outline'}`}>
              {plan === 'free' ? 'Upgrade' : 'Manage'}
            </button>
          </div>
          {plan !== 'max' && (
            <div className="bg-gradient-to-r from-primary/5 to-creator/5 rounded-xl p-4 flex items-start gap-3">
              <Crown size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Unlock Max plan</p>
                <p className="text-xs text-gray-500">Get AI bargain agent, featured listing, dedicated support & 15% fee for $29.99/mo.</p>
                <button onClick={() => navigate('/pricing')} className="text-xs font-bold text-primary mt-2 hover:underline flex items-center gap-1">
                  See all plans <ChevronRight size={11} />
                </button>
              </div>
            </div>
          )}
        </div>

        <Section title="Appearance">
          <SettingRow icon={Moon} label="Dark Mode" desc="Switch between light and dark theme" right={<Toggle checked={darkMode} onChange={toggleDark} />} />
        </Section>

        <Section title="Notifications">
          <SettingRow label="New Orders" desc="When a brand places an order" right={<Toggle checked={notifs.newOrder} onChange={v => setNotifs(n => ({ ...n, newOrder: v }))} />} />
          <SettingRow label="Messages" desc="New messages from brands" right={<Toggle checked={notifs.messages} onChange={v => setNotifs(n => ({ ...n, messages: v }))} />} />
          <SettingRow label="Payments" desc="Earnings and wallet activity" right={<Toggle checked={notifs.payments} onChange={v => setNotifs(n => ({ ...n, payments: v }))} />} />
          <SettingRow label="Campaign Matches" desc="New campaigns matching your profile" right={<Toggle checked={notifs.campaigns} onChange={v => setNotifs(n => ({ ...n, campaigns: v }))} />} />
          <SettingRow label="Marketing Emails" desc="Tips, news, and OgisBack updates" right={<Toggle checked={notifs.marketing} onChange={v => setNotifs(n => ({ ...n, marketing: v }))} />} />
        </Section>

        <Section title="Privacy">
          <SettingRow label="Show Rates Publicly" desc="Brands can see your rate card" right={<Toggle checked={privacy.showRates} onChange={v => setPrivacy(p => ({ ...p, showRates: v }))} />} />
          <SettingRow label="Show Earnings" desc="Display completed orders on profile" right={<Toggle checked={privacy.showEarnings} onChange={v => setPrivacy(p => ({ ...p, showEarnings: v }))} />} />
          <SettingRow label="Allow Direct Messages" desc="Brands can message you directly" right={<Toggle checked={privacy.allowDMs} onChange={v => setPrivacy(p => ({ ...p, allowDMs: v }))} />} />
        </Section>

        <Section title="Account">
          <SettingRow icon={CreditCard} label="Payment Methods" desc="Manage withdrawal accounts" right={<button onClick={() => navigate('/creator/withdraw')} className="text-primary"><ChevronRight size={16} /></button>} />
          <SettingRow icon={Shield} label="Security" desc="Instagram connection & 2FA" right={<button onClick={() => toast.success('Security settings opened')} className="text-primary"><ChevronRight size={16} /></button>} />
          <SettingRow icon={Trash2} label="Delete Account" desc="Permanently delete your account and data" right={<button onClick={() => toast.error('Please contact support to delete your account')} className="text-red-500 text-sm font-medium">Delete</button>} />
        </Section>

        <button onClick={handleLogout} className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 btn-lg w-full dark:border-red-800 dark:hover:bg-red-900/20">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </DashboardLayout>
  );
}
