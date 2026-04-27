import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, MapPin, Save, CheckCircle, Camera, Info,
  ArrowRight, Star, DollarSign, Globe, AtSign, TrendingUp, X,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { fetchYouTubeStats, getTikTokAuthUrl, fetchInstagramStats, fetchInstagramProfile, fetchTikTokStats, fetchTikTokFollowers, getFacebookAuthUrl, getYouTubeAnalyticsAuthUrl } from '../../lib/socialApi';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { updateCreatorProfile, getCreatorProfile, getCreatorPosts } from '../../lib/db';
import { uploadAvatar, uploadCover } from '../../lib/storage';

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

const analyticsFields = [
  {
    platform: 'instagram',
    label: 'Instagram',
    engKey: 'instagramEngagement',
    likesKey: 'instagramAvgLikes',
    commentsKey: 'instagramAvgComments',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/10',
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    engKey: 'tiktokEngagement',
    likesKey: 'tiktokAvgLikes',
    commentsKey: 'tiktokAvgComments',
    color: 'text-gray-900 dark:text-white',
    bg: 'bg-gray-50 dark:bg-gray-800',
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    engKey: 'youtubeEngagement',
    likesKey: 'youtubeAvgLikes',
    commentsKey: 'youtubeAvgComments',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/10',
  },
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

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function CreatorProfileEdit() {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isSetup = params.get('setup') === 'true';
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);
  const [coverUrl, setCoverUrl] = useState(user?.cover || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

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
    instagramEngagement: '',
    tiktokEngagement: '',
    youtubeEngagement: '',
    instagramAvgLikes: '',
    instagramAvgComments: '',
    tiktokAvgLikes: '',
    tiktokAvgComments: '',
    youtubeAvgLikes: '',
    youtubeAvgComments: '',
    ratePost: '',
    rateReel: '',
    rateStory: '',
    rateVideo: '',
    niche: [],
    audienceLocations: [],
    age: '',
    gender: '',
    lat: null,
    lng: null,
  });
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [syncingYT, setSyncingYT] = useState(false);
  const [syncingIG, setSyncingIG] = useState(false);
  const [syncingTT, setSyncingTT] = useState(false);

  const syncYouTube = async (e) => {
    const handle = (e?.target?.value ?? form.youtube)?.trim();
    if (!handle) return;
    setSyncingYT(true);
    try {
      const stats = await fetchYouTubeStats(handle);
      if (!stats) {
        toast.error('Channel not found. Check the handle and try again.');
      } else {
        update('youtubeFollowers',   stats.subscribers);
        if (stats.engRate)     update('youtubeEngagement',  stats.engRate);
        if (stats.avgLikes)    update('youtubeAvgLikes',    stats.avgLikes);
        if (stats.avgComments) update('youtubeAvgComments', stats.avgComments);
        toast.success(`Synced: ${stats.subscribers.toLocaleString()} subscribers · ${stats.engRate}% engagement`);
      }
    } catch (err) {
      if (err.message === 'quota') {
        toast.error('YouTube API quota exceeded for today. Try again tomorrow.');
      } else if (err.message === 'keyInvalid' || err.message === 'noKey') {
        toast.error('YouTube API key is missing or invalid. Check your .env file.');
      } else {
        toast.error('Could not reach YouTube. Check your connection and try again.');
      }
    }
    setSyncingYT(false);
  };

  const syncInstagram = async () => {
    const handle = form.instagram?.trim();
    if (!handle) { toast.error('Enter your Instagram handle first'); return; }
    setSyncingIG(true);
    try {
      const data = await fetchInstagramProfile(handle);
      if (!data?.profile) throw new Error('Profile not found');
      const { followerCount, engagementRate, avgLikes, avgComments } = data.profile;
      setForm(f => ({
        ...f,
        instagramFollowers:    followerCount,
        instagramEngagement:   engagementRate  || f.instagramEngagement,
        instagramAvgLikes:     avgLikes        || f.instagramAvgLikes,
        instagramAvgComments:  avgComments     || f.instagramAvgComments,
      }));
      toast.success(`Synced: ${followerCount.toLocaleString()} followers · ${engagementRate}% engagement`);
    } catch (err) {
      const isCredit = err.message?.includes('402') || err.message?.toLowerCase().includes('credit') || err.message?.toLowerCase().includes('payment');
      toast.error(isCredit
        ? 'Instagram API credits exhausted. Your saved data is still shown.'
        : `Instagram sync failed: ${err.message}`
      );
    }
    setSyncingIG(false);
  };

  const syncTikTok = async () => {
    const handle = form.tiktok?.trim();
    if (!handle) { toast.error('Enter your TikTok handle first'); return; }
    setSyncingTT(true);
    try {
      const data = await fetchTikTokFollowers({ handle });
      const total = data?.total ?? 0;

      // Aggregate regions from the follower sample into audience_locations
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const toCountry = (code) => { try { return regionNames.of(code) || code; } catch { return code; } };
      const regionMap = {};
      (data?.followers ?? []).forEach(f => {
        if (f.region) regionMap[f.region] = (regionMap[f.region] || 0) + 1;
      });
      const sampleSize = (data?.followers ?? []).length;
      const topLocations = Object.entries(regionMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([code, count]) => ({
          city: toCountry(code),
          percent: String(Math.round((count / sampleSize) * 100)),
        }));

      // Compute engagement from creator's Ogisback posts
      let avgLikes = 0, avgComments = 0, engRate = 0;
      try {
        const posts = await getCreatorPosts(user.id);
        if (posts.length > 0) {
          avgLikes    = Math.round(posts.reduce((s, p) => s + (p.likes    || 0), 0) / posts.length);
          avgComments = Math.round(posts.reduce((s, p) => s + (p.comments || 0), 0) / posts.length);
          engRate     = total > 0
            ? parseFloat(((avgLikes + avgComments) / total * 100).toFixed(2))
            : 0;
        }
      } catch { /* non-fatal */ }

      setForm(f => ({
        ...f,
        tiktokFollowers:    total,
        tiktokAvgLikes:     avgLikes    || f.tiktokAvgLikes,
        tiktokAvgComments:  avgComments || f.tiktokAvgComments,
        tiktokEngagement:   engRate     || f.tiktokEngagement,
        audienceLocations:  topLocations.length > 0 ? topLocations : f.audienceLocations,
      }));

      // Persist audience locations immediately so Analytics reflects the update without needing Save
      if (topLocations.length > 0 && user?.id) {
        try {
          await updateCreatorProfile(user.id, {
            tiktok_followers: total,
            audience_locations: topLocations.map(l => ({
              city:    l.city || l.country,
              percent: parseFloat(l.percent) || 0,
            })),
          });
        } catch { /* non-fatal — user can still Save manually */ }
      }

      const locMsg = topLocations.length > 0
        ? ` · ${topLocations.length} audience countries detected`
        : '';
      toast.success(`Synced: ${total.toLocaleString()} followers${locMsg}`);
    } catch (err) {
      const msg = String(err?.message || err);
      const isNotFound = msg.includes('404') || msg.toLowerCase().includes('not found');
      toast.error(isNotFound
        ? `TikTok account @${form.tiktok?.replace(/^@/, '')} not found. Check the handle.`
        : `TikTok sync failed: ${msg}`);
    }
    setSyncingTT(false);
  };

  // Pre-populate form from existing creator_profiles row
  useEffect(() => {
    if (!user?.id) { setProfileLoading(false); return; }
    getCreatorProfile(user.id)
      .then(profile => {
        if (!profile) return;
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile.cover_url) setCoverUrl(profile.cover_url);
        setForm({
          name: profile.name || user?.name || '',
          bio: profile.bio || '',
          location: profile.location || '',
          website: profile.website || '',
          instagram: profile.instagram || '',
          tiktok: profile.tiktok || '',
          youtube: profile.youtube || '',
          instagramFollowers: profile.instagram_followers || '',
          tiktokFollowers: profile.tiktok_followers || '',
          youtubeFollowers: profile.youtube_followers || '',
          instagramEngagement: profile.instagram_engagement || '',
          tiktokEngagement: profile.tiktok_engagement || '',
          youtubeEngagement: profile.youtube_engagement || '',
          instagramAvgLikes: profile.instagram_avg_likes || '',
          instagramAvgComments: profile.instagram_avg_comments || '',
          tiktokAvgLikes: profile.tiktok_avg_likes || '',
          tiktokAvgComments: profile.tiktok_avg_comments || '',
          youtubeAvgLikes: profile.youtube_avg_likes || '',
          youtubeAvgComments: profile.youtube_avg_comments || '',
          ratePost: profile.rate_post || '',
          rateReel: profile.rate_reel || '',
          rateStory: profile.rate_story || '',
          rateVideo: profile.rate_video || '',
          niche: profile.niche || [],
          audienceLocations: profile.audience_locations?.length
            ? profile.audience_locations.map(l => ({ city: l.city || l.country, percent: String(l.percent) }))
            : [],
          age: profile.age ?? '',
          gender: profile.gender ?? '',
          lat: profile.latitude ?? null,
          lng: profile.longitude ?? null,
        });
      })
      .catch(err => console.error('[ProfileEdit] load error:', err))
      .finally(() => setProfileLoading(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      await updateCreatorProfile(user.id, { avatar_url: url });
      setAvatarUrl(url);
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return; }
    setCoverUploading(true);
    try {
      const url = await uploadCover(user.id, file);
      await updateCreatorProfile(user.id, { cover_url: url });
      setCoverUrl(url);
      toast.success('Cover photo updated');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

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
      const validLocations = form.audienceLocations.filter(l => (l.city || l.country) && l.percent);
      await updateCreatorProfile(user.id, {
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location || null,
        website: form.website || null,
        niche: form.niche,
        instagram: form.instagram || null,
        tiktok: form.tiktok || null,
        youtube: form.youtube || null,
        instagram_followers: parseInt(form.instagramFollowers) || 0,
        tiktok_followers: parseInt(form.tiktokFollowers) || 0,
        youtube_followers: parseInt(form.youtubeFollowers) || 0,
        instagram_engagement: parseFloat(form.instagramEngagement) || 0,
        tiktok_engagement: parseFloat(form.tiktokEngagement) || 0,
        youtube_engagement: parseFloat(form.youtubeEngagement) || 0,
        instagram_avg_likes: parseInt(form.instagramAvgLikes) || 0,
        instagram_avg_comments: parseInt(form.instagramAvgComments) || 0,
        tiktok_avg_likes: parseInt(form.tiktokAvgLikes) || 0,
        tiktok_avg_comments: parseInt(form.tiktokAvgComments) || 0,
        youtube_avg_likes: parseInt(form.youtubeAvgLikes) || 0,
        youtube_avg_comments: parseInt(form.youtubeAvgComments) || 0,
        rate_post: parseFloat(form.ratePost) || null,
        rate_reel: parseFloat(form.rateReel) || null,
        rate_story: parseFloat(form.rateStory) || null,
        rate_video: parseFloat(form.rateVideo) || null,
        audience_locations: validLocations.map(l => ({ city: l.city || l.country, percent: parseFloat(l.percent) })),
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender || null,
        latitude: form.lat,
        longitude: form.lng,
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

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <span className="w-8 h-8 border-4 border-creator/20 border-t-creator rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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

        {/* Hidden file inputs */}
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

        {/* ── Profile photo ── */}
        <div className="card p-6 mb-5">
          <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white mb-1">Profile Photo</h2>
          <p className="text-xs text-gray-400 mb-4">Your photo is the first thing brands see. Use a clear, professional headshot.</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarUrl || 'https://i.pravatar.cc/150?img=47'}
                alt="Profile"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow"
              />
              <button
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-creator text-white rounded-full flex items-center justify-center shadow disabled:opacity-60"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                title="Change photo"
              >
                {avatarUploading
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Camera size={13} />}
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Your Name'}</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Creator Account</p>
              <div className="flex gap-2">
                <button
                  className="btn btn-outline btn-sm text-xs disabled:opacity-60"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? 'Uploading...' : 'Upload New Photo'}
                </button>
                <button
                  className="btn btn-outline btn-sm text-xs disabled:opacity-60"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                >
                  {coverUploading ? 'Uploading...' : 'Change Cover'}
                </button>
              </div>
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
                  className="input pl-9 pr-28"
                />
                <button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-all"
                >
                  <MapPin size={11} /> Pick on map
                </button>
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
            <div className="form-group">
              <label className="label">Age</label>
              <input
                type="number"
                min={13}
                max={100}
                value={form.age}
                onChange={e => update('age', e.target.value)}
                placeholder="e.g. 24"
                className="input"
              />
              <FieldHint>Used to match you with age-targeted brand campaigns.</FieldHint>
            </div>
            <div className="form-group">
              <label className="label">Gender</label>
              <select
                value={form.gender}
                onChange={e => update('gender', e.target.value)}
                className="input"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              <FieldHint>Brands may filter creators by gender for specific campaigns.</FieldHint>
            </div>
          </div>

          {/* Map Location Picker Modal */}
          {showMapPicker && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl">
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Click your location on the map</p>
                  <button onClick={() => setShowMapPicker(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <X size={16} />
                  </button>
                </div>
                <div style={{ height: 360 }}>
                  <MapContainer
                    center={form.lat && form.lng ? [form.lat, form.lng] : [20, 0]}
                    zoom={form.lat ? 10 : 2}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
                    <LocationPicker onPick={async (lat, lng) => {
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                        const data = await res.json();
                        const city = data.address?.city || data.address?.town || data.address?.village || '';
                        const country = data.address?.country || '';
                        update('location', [city, country].filter(Boolean).join(', '));
                      } catch {
                        // silent — user can still type location manually
                      }
                      setForm(f => ({ ...f, lat, lng }));
                      setShowMapPicker(false);
                    }} />
                    {form.lat && form.lng && <Marker position={[form.lat, form.lng]} />}
                  </MapContainer>
                </div>
              </div>
            </div>
          )}
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
                        onBlur={p.key === 'youtube' ? syncYouTube : undefined}
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
                    {p.key === 'youtube' && (
                      <button
                        type="button"
                        onClick={syncYouTube}
                        disabled={syncingYT || !form.youtube}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {syncingYT ? 'Syncing…' : '↻ Sync from YouTube'}
                      </button>
                    )}
                    {p.key === 'instagram' && (
                      <button
                        type="button"
                        onClick={syncInstagram}
                        disabled={syncingIG || !form.instagram}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-pink-500 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {syncingIG ? 'Syncing…' : '↻ Sync from Instagram'}
                      </button>
                    )}
                    {p.key === 'tiktok' && (
                      <button
                        type="button"
                        onClick={syncTikTok}
                        disabled={syncingTT || !form.tiktok}
                        className="mt-1.5 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {syncingTT ? 'Syncing…' : '↻ Sync from TikTok'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Connect Platforms (OAuth) ── */}
        <div className="card p-6 mb-5">
          <div className="mb-5">
            <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe size={16} className="text-primary" />Connect Platforms
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              One-click OAuth connections unlock audience insights, auto-sync follower counts, and verify your accounts to brands.
            </p>
          </div>
          <div className="space-y-3">
            {/* Facebook / Instagram Business */}
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Facebook & Instagram Business</p>
                <p className="text-xs text-gray-400 mt-0.5">Unlocks audience demographics, city-level insights, and auto-syncs follower counts.</p>
              </div>
              <button
                onClick={() => {
                  const url = getFacebookAuthUrl(`${window.location.origin}/auth/facebook`);
                  window.location.href = url;
                }}
                className="btn btn-sm bg-[#1877F2] hover:bg-[#1565C0] text-white flex-shrink-0 gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                Connect
              </button>
            </div>

            {/* YouTube Analytics */}
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">YouTube Analytics</p>
                <p className="text-xs text-gray-400 mt-0.5">Connects via Google OAuth to pull country demographics, age/gender data, and real subscriber counts.</p>
              </div>
              <button
                onClick={() => {
                  const url = getYouTubeAnalyticsAuthUrl(`${window.location.origin}/auth/youtube`);
                  window.location.href = url;
                }}
                className="btn btn-sm bg-[#FF0000] hover:bg-[#CC0000] text-white flex-shrink-0 gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                  <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white" />
                </svg>
                Connect
              </button>
            </div>

            {/* TikTok OAuth */}
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">TikTok</p>
                <p className="text-xs text-gray-400 mt-0.5">OAuth connection to verify your account and auto-sync follower counts.</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const url = await getTikTokAuthUrl(`${window.location.origin}/auth/tiktok`);
                    window.location.href = url;
                  } catch (err) {
                    toast.error('Could not start TikTok connection. Check your client key.');
                  }
                }}
                className="btn btn-sm bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 flex-shrink-0 gap-1.5"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
                </svg>
                Connect
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2">
            <Info size={13} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              OAuth connections are <strong>secure and revocable</strong>. We only request read access and never post on your behalf. You can disconnect any time.
            </p>
          </div>
        </div>

        {/* ── Analytics Stats ── */}
        <div className="card p-6 mb-5">
          <div className="mb-5">
            <h2 className="text-base font-heading font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />Analytics Stats
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Brands use these stats to evaluate your reach. Add your engagement rate, average likes and comments per post for each platform.
            </p>
          </div>
          <div className="space-y-5">
            {analyticsFields.filter(a => form[a.platform]).map(a => (
              <div key={a.platform} className={`rounded-2xl border border-gray-100 dark:border-gray-800 p-4 ${a.bg}`}>
                <p className={`font-heading font-semibold text-sm mb-3 ${a.color}`}>{a.label}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="label text-xs">Engagement Rate %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form[a.engKey]}
                      onChange={e => update(a.engKey, e.target.value)}
                      placeholder="e.g. 4.8"
                      min="0"
                      max="100"
                      className="input text-sm"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label text-xs">Avg Likes / Post</label>
                    <input
                      type="number"
                      value={form[a.likesKey]}
                      onChange={e => update(a.likesKey, e.target.value)}
                      placeholder="e.g. 12000"
                      min="0"
                      className="input text-sm"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label text-xs">Avg Comments / Post</label>
                    <input
                      type="number"
                      value={form[a.commentsKey]}
                      onChange={e => update(a.commentsKey, e.target.value)}
                      placeholder="e.g. 450"
                      min="0"
                      className="input text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            {!form.instagram && !form.tiktok && !form.youtube && (
              <p className="text-xs text-gray-400 text-center py-2">Add a platform handle above to unlock analytics fields.</p>
            )}
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
