import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, MapPin, Save, CheckCircle, Camera, Info,
  ArrowRight, Star, DollarSign, Globe, AtSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { updateCreatorProfile } from '../../lib/db';

const niches = [
  'Fashion', 'Beauty', 'Skincare', 'Tech', 'Gaming',
  'Fitness', 'Health', 'Food', 'Travel', 'Finance',
  'Lifestyle', 'Education', 'Wellness', 'Business', 'Music', 'Art',
];

const platforms = [
  {
    key: 'instagram',
    followerKey: 'instagramFollowers',
    label: 'Instagram',
    placeholder: 'yourhandle',
    hint: 'Your most active platform for brand deals.',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/10',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    key: 'tiktok',
    followerKey: 'tiktokFollowers',
    label: 'TikTok',
    placeholder: 'yourhandle',
    hint: 'Short-form video reach brands look for.',
    color: 'text-gray-900 dark:text-white',
    bg: 'bg-gray-50 dark:bg-gray-800',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
  },
  {
    key: 'youtube',
    followerKey: 'youtubeFollowers',
    label: 'YouTube',
    placeholder: 'channel name',
    hint: 'Long-form content commands higher deal rates.',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/10',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white" />
      </svg>
    ),
  },
];

const rateFields = [
  { key: 'ratePost', label: 'Instagram Post', desc: 'Single feed photo or carousel' },
  { key: 'rateReel', label: 'Reel / TikTok Video', desc: 'Short-form video content' },
  { key: 'rateStory', label: 'Story Set', desc: 'Up to 5 sequential stories' },
  { key: 'rateVideo', label: 'YouTube Video', desc: 'Dedicated or integrated mention' },
];

const SETUP_STEPS = ['Your Identity', 'Content Niches', 'Social Platforms', 'Your Rates'];

function FieldHint({ children }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-gray-400 mt-1.5">
      <Info size={11} className="mt-0.5 flex-shrink-0" />
      {children}
    </p>
  );
}

export default function CreatorProfileEdit() {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isSetup = params.get('setup') === 'true';

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: '',
    location: '',
    website: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    instagramFollowers: '',
    tiktokFollowers: '',
    youtubeFollowers: '',
    ratePost: '',
    rateReel: '',
    rateStory: '',
    rateVideo: '',
    niche: [],
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleNiche = (n) => {
    if (form.niche.includes(n)) {
      update('niche', form.niche.filter(x => x !== n));
    } else if (form.niche.length < 5) {
      update('niche', [...form.niche, n]);
    } else {
      toast.error('You can select up to 5 niches');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Display name is required'); return; }
    if (!form.bio.trim()) { toast.error('A bio is required — brands read it before reaching out'); return; }
    if (form.niche.length === 0) { toast.error('Select at least one content niche'); return; }
    setSaving(true);
    try {
      await updateCreatorProfile(user.id, {
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location || null,
        website: form.website || null,
        niche: form.niche,
        instagram_handle: form.instagram || null,
        tiktok_handle: form.tiktok || null,
        youtube_handle: form.youtube || null,
        instagram_followers: parseInt(form.instagramFollowers) || 0,
        tiktok_followers: parseInt(form.tiktokFollowers) || 0,
        youtube_followers: parseInt(form.youtubeFollowers) || 0,
        rate_post: parseFloat(form.ratePost) || null,
        rate_reel: parseFloat(form.rateReel) || null,
        rate_story: parseFloat(form.rateStory) || null,
        rate_video: parseFloat(form.rateVideo) || null,
      });
      await completeProfile();
      toast.success(isSetup ? 'Profile complete! Welcome to OgisBack.' : 'Profile updated successfully.');
      navigate('/creator/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Completion score for progress bar
  const filled = [
    form.name, form.bio, form.location,
    form.niche.length > 0,
    form.instagram || form.tiktok || form.youtube,
    form.ratePost || form.rateReel,
  ].filter(Boolean).length;
  const progress = Math.round((filled / 6) * 100);

  return (
    <DashboardLayout>
      <SEO title="Edit Profile" noindex={true} />
      <div className="max-w-2xl mx-auto">

        {/* ── Setup welcome banner ── */}
        {isSetup && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-creator text-white p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Star size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg mb-1">Build your creator profile</h2>
                <p className="text-white/80 text-sm leading-relaxed">
                  Brands browse profiles before sending offers. A complete profile with rates and platform stats gets
                  <strong className="text-white"> 4× more inbound deals</strong>. Takes about 2 minutes.
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/20">
              {SETUP_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-white text-creator' : 'bg-white/20 text-white/60'}`}>
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title">{isSetup ? 'Creator Profile Setup' : 'Edit Your Profile'}</h1>
            <p className="page-subtitle mt-1">
              {isSetup
                ? 'This is your public page — fill it out so brands know who you are and what you charge.'
                : 'Keep your profile up to date to attract the best brand deals.'}
            </p>
          </div>
          {!isSetup && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400 mb-1">Profile completeness</div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-gradient-creator rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-creator">{progress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Profile photo ── */}
        <div className="card p-6 mb-5">
          <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white mb-1">Profile Photo</h2>
          <p className="text-xs text-gray-400 mb-4">Your photo is the first thing brands see. Use a clear, professional headshot.</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user?.avatar || 'https://i.pravatar.cc/150?img=47'}
                alt="Profile"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow"
              />
              <button
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-creator text-white rounded-full flex items-center justify-center shadow"
                onClick={() => toast('Photo upload coming soon')}
                title="Change photo"
              >
                <Camera size={13} />
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Your Name'}</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Creator Account</p>
              <button
                className="btn btn-outline btn-sm text-xs"
                onClick={() => toast('Photo upload coming soon')}
              >
                Upload New Photo
              </button>
            </div>
          </div>
        </div>

        {/* ── Basic Info ── */}
        <div className="card p-6 mb-5 space-y-5">
          <div>
            <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white">Your Identity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Appears on your public creator profile and in brand search results.</p>
          </div>

          <div className="form-group">
            <label className="label">
              Display Name <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="input pl-9"
              />
            </div>
            <FieldHint>Use your real name or your well-known creator alias — brands search by name.</FieldHint>
          </div>

          <div className="form-group">
            <label className="label">
              Bio <span className="text-red-400 ml-0.5">*</span>
            </label>
            <textarea
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              placeholder="Tell brands who you are, what type of content you create, and who your audience is. Be specific — e.g. 'Fashion & lifestyle creator based in NYC, 312K Instagram followers, 4.8% engagement rate. Specialising in sustainable fashion and authentic brand storytelling.'"
              rows={4}
              className="input resize-none"
              maxLength={500}
            />
            <div className="flex items-start justify-between mt-1.5">
              <FieldHint>Brands read your bio before sending any offer. Be clear about your niche, audience, and content style.</FieldHint>
              <span className="text-xs text-gray-400 ml-4 flex-shrink-0">{form.bio.length}/500</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <FieldHint>Brands often look for local creators for events and geo-targeted campaigns.</FieldHint>
            </div>
            <div className="form-group">
              <label className="label">Personal Website</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.website}
                  onChange={e => update('website', e.target.value)}
                  placeholder="https://yoursite.com"
                  className="input pl-9"
                />
              </div>
              <FieldHint>Optional — link to your media kit or portfolio.</FieldHint>
            </div>
          </div>
        </div>

        {/* ── Niches ── */}
        <div className="card p-6 mb-5">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white">
                Content Niches <span className="text-red-400 ml-0.5">*</span>
              </h2>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${form.niche.length > 0 ? 'bg-creator/10 text-creator' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                {form.niche.length} / 5 selected
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select the categories that best describe your content. Brands filter creators by niche — choose accurately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {niches.map(n => {
              const selected = form.niche.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => toggleNiche(n)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? 'bg-creator text-white border-creator shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-creator/50 hover:text-creator'
                  }`}
                >
                  {selected && <CheckCircle size={12} />}
                  {n}
                </button>
              );
            })}
          </div>
          {form.niche.length === 5 && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Info size={11} /> Maximum of 5 niches reached. Deselect one to change your selection.
            </p>
          )}
        </div>

        {/* ── Social Platforms ── */}
        <div className="card p-6 mb-5">
          <div className="mb-5">
            <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white">Social Platforms</h2>
            <p className="text-xs text-gray-400 mt-1">
              Add at least one platform. Your follower counts are displayed on your public profile and shown to brands.
            </p>
          </div>
          <div className="space-y-5">
            {platforms.map(p => (
              <div key={p.key} className={`rounded-2xl border border-gray-100 dark:border-gray-800 p-4 ${p.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={p.color}>{p.icon}</span>
                  <span className="font-heading font-semibold text-sm text-gray-900 dark:text-white">{p.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{p.hint}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label text-xs">Handle</label>
                    <div className="relative">
                      <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={form[p.key]}
                        onChange={e => update(p.key, e.target.value)}
                        placeholder={p.placeholder}
                        className="input pl-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label text-xs">Follower Count</label>
                    <input
                      type="number"
                      value={form[p.followerKey]}
                      onChange={e => update(p.followerKey, e.target.value)}
                      placeholder="e.g. 50000"
                      min="0"
                      className="input text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rates ── */}
        <div className="card p-6 mb-6">
          <div className="mb-5">
            <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white">Your Rates (USD)</h2>
            <p className="text-xs text-gray-400 mt-1">
              Set your starting rates for each content type. Brands see these before sending an offer.
              You keep <strong className="text-creator">80%</strong> of every deal after the platform fee.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {rateFields.map(r => (
              <div key={r.key} className="form-group">
                <label className="label">{r.label}</label>
                <p className="text-xs text-gray-400 mb-1.5">{r.desc}</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                  <input
                    type="number"
                    value={form[r.key]}
                    onChange={e => update(r.key, e.target.value)}
                    placeholder="0"
                    min="0"
                    className="input pl-7"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-creator/5 border border-creator/10 flex items-start gap-2">
            <DollarSign size={14} className="text-creator mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              These are your <strong>base rates</strong>. You can negotiate individually on each campaign. Brands
              cannot contact you without agreeing to pay at least your minimum rate through escrow.
            </p>
          </div>
        </div>

        {/* ── Save ── */}
        <div className="card p-5 mb-6">
          {isSetup && (
            <p className="text-xs text-gray-400 mb-4 flex items-start gap-1.5">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              You can update any of this information later from your Settings page.
            </p>
          )}
          <div className="flex gap-3">
            {!isSetup && (
              <button onClick={() => navigate(-1)} className="btn btn-outline btn-lg flex-1">
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-creator btn-lg flex-1 disabled:opacity-60"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving your profile...
                </span>
              ) : isSetup ? (
                <>
                  <CheckCircle size={17} />
                  Complete Profile &amp; Start Earning
                  <ArrowRight size={16} />
                </>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
