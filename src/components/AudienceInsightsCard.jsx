import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, RefreshCw, Clock, ShieldCheck } from 'lucide-react';
import DonutChart from './ui/DonutChart';
import { fetchInstagramAudienceInsights, fetchYouTubeAudienceInsights } from '../lib/socialApi';
import toast from 'react-hot-toast';

const COUNTRY_COLORS = ['#EC4899', '#7C3AED', '#0D9488', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#10B981'];
const AGE_COLORS     = { female: '#EC4899', male: '#3B82F6' };

const PLATFORM_CFG = {
  Instagram: {
    color:  '#E1306C',
    bg:     'bg-pink-50 dark:bg-pink-900/10',
    border: 'border-pink-100 dark:border-pink-900/30',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  YouTube: {
    color:  '#FF0000',
    bg:     'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-100 dark:border-red-900/30',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white" />
      </svg>
    ),
  },
  TikTok: {
    color:  '#111827',
    bg:     'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
  },
};

// Country code → name helper
const regionNames = typeof Intl !== 'undefined' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
function toCountryName(code) {
  if (!code || !regionNames) return code;
  try { return regionNames.of(code.toUpperCase()) || code; } catch { return code; }
}

function formatSyncTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AudienceInsightsCard({ analytics, userId }) {
  const [activeTab, setActiveTab] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [syncing, setSyncing] = useState(null); // 'instagram' | 'youtube' | null

  // Build platform data arrays
  const platformData = {};

  // Instagram audience data — prefer city-level if available, fall back to countries
  const igCities    = analytics?.instagram_audience_cities    || [];
  const igCountries = analytics?.instagram_audience_countries || [];
  const igAgeGender = analytics?.instagram_audience_age_gender || [];
  if (igCities.length > 0 || igCountries.length > 0 || igAgeGender.length > 0) {
    const hasCities   = igCities.length > 0;
    const primaryData = hasCities
      ? igCities.map(c => ({ label: c.city, percent: c.percent }))
      : igCountries.map(c => ({ label: toCountryName(c.country), percent: c.percent }));
    platformData.Instagram = {
      countries: primaryData,
      ageGender: igAgeGender,
      lastSync:  analytics.instagram_audience_last_sync,
      isCity:    hasCities,
    };
  }

  // YouTube audience data (from YouTube Analytics OAuth — city-level via dimensions=city)
  if (analytics?.youtube_audience_countries?.length > 0 || analytics?.youtube_audience_age_gender?.length > 0) {
    platformData.YouTube = {
      countries: (analytics.youtube_audience_countries || []).map(c => ({
        label:   c.city || toCountryName(c.country) || 'Unknown',
        percent: c.percent,
      })),
      ageGender: analytics.youtube_audience_age_gender || [],
      lastSync:  analytics.youtube_audience_last_sync,
      isCity: true,
    };
  }


  const availablePlatforms = Object.keys(platformData);

  // Auto-select first available platform
  useEffect(() => {
    if (activeTab && availablePlatforms.includes(activeTab)) return;
    if (availablePlatforms.length > 0) setActiveTab(availablePlatforms[0]);
    else setActiveTab(null);
  }, [availablePlatforms.join(',')]); // eslint-disable-line

  const handleResync = async (platform) => {
    if (!userId) return;
    setSyncing(platform.toLowerCase());
    try {
      if (platform === 'Instagram') {
        await fetchInstagramAudienceInsights(userId);
        toast.success('Instagram audience insights refreshed!');
      } else if (platform === 'YouTube') {
        await fetchYouTubeAudienceInsights(userId);
        toast.success('YouTube audience insights refreshed!');
      }
      // Reload page to reflect updated data
      window.location.reload();
    } catch (err) {
      toast.error(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  if (availablePlatforms.length === 0) {
    return (
      <div className="card p-6 relative overflow-hidden">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <Users size={16} className="text-primary" />Audience Insights
        </h2>
        <div className="h-44 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
            <Globe size={24} className="text-gray-300 dark:text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">No audience data yet</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Connect YouTube Analytics in Profile Settings to unlock real city-level audience breakdowns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const current = platformData[activeTab] || {};
  const cfg     = PLATFORM_CFG[activeTab] || {};
  const countryDonut = (current.countries || []).slice(0, 6).map((c, i) => ({
    label: c.label,
    value: c.percent,
    color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
  }));

  return (
    <div className="card p-6 relative overflow-hidden">
      {/* Subtle texture */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #00000008 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="dark:block hidden absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff05 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative">
        {/* Header with platform tabs */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title flex items-center gap-2 mb-0">
            <Users size={16} className="text-primary" />Audience Insights
          </h2>
          <div className="flex items-center gap-2">
            {availablePlatforms.length > 1 && (
              <div className="flex gap-1">
                {availablePlatforms.map(p => (
                  <button
                    key={p}
                    onClick={() => setActiveTab(p)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all duration-150 ${
                      activeTab === p
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15'
                    }`}
                  >
                    <span className={activeTab === p ? 'text-white' : ''}>{PLATFORM_CFG[p]?.icon}</span>
                    {p}
                  </button>
                ))}
              </div>
            )}
            {/* Re-sync button */}
            {(activeTab === 'Instagram' || activeTab === 'YouTube') && (
              <button
                onClick={() => handleResync(activeTab)}
                disabled={!!syncing}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all disabled:opacity-40"
                title={`Refresh ${activeTab} audience data`}
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Platform badge + sync time */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.border} border`}
                style={{ color: cfg.color }}>
                {cfg.icon} {activeTab}
              </div>
              {current.lastSync && (
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock size={10} /> Synced {formatSyncTime(current.lastSync)}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full ml-auto">
                <ShieldCheck size={10} /> Verified
              </span>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Countries / Locations */}
              {countryDonut.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    <Globe size={10} className="inline mr-1" />
                    {current.isCity ? 'Top Cities' : 'Top Countries'}
                  </p>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
                      <DonutChart
                        data={countryDonut}
                        size={130}
                        thickness={22}
                        onHover={setHoveredCountry}
                        hoveredIdx={hoveredCountry}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {hoveredCountry !== null && countryDonut[hoveredCountry] ? (
                          <>
                            <span className="text-lg font-black leading-none" style={{ color: countryDonut[hoveredCountry].color }}>
                              {countryDonut[hoveredCountry].value}%
                            </span>
                            <span className="text-[8px] text-gray-400 text-center mt-0.5 max-w-[56px] truncate">
                              {countryDonut[hoveredCountry].label}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-black text-gray-800 dark:text-gray-200 leading-none">{countryDonut.length}</span>
                            <span className="text-[8px] text-gray-400 uppercase tracking-wide mt-0.5">
                              {current.isCity ? 'cities' : 'countries'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {countryDonut.map((d, i) => (
                        <div
                          key={d.label + i}
                          className="flex items-center gap-2 cursor-default"
                          onMouseEnter={() => setHoveredCountry(i)}
                          onMouseLeave={() => setHoveredCountry(null)}
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-150"
                            style={{ background: d.color, transform: hoveredCountry === i ? 'scale(1.5)' : 'scale(1)' }} />
                          <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{d.label}</span>
                          <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: d.color }}>{d.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Age & Gender Breakdown */}
              {current.ageGender?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    <Users size={10} className="inline mr-1" />Age & Gender
                  </p>
                  <div className="space-y-2.5">
                    {current.ageGender.map(b => {
                      const total = (b.female || 0) + (b.male || 0);
                      return (
                        <div key={b.range}>
                          <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                            <span className="font-medium">{b.range}</span>
                            <span className="tabular-nums">{total.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
                            <motion.div
                              className="h-full"
                              style={{ background: AGE_COLORS.female }}
                              initial={{ width: 0 }}
                              animate={{ width: `${b.female || 0}%` }}
                              transition={{ duration: 0.6 }}
                            />
                            <motion.div
                              className="h-full"
                              style={{ background: AGE_COLORS.male }}
                              initial={{ width: 0 }}
                              animate={{ width: `${b.male || 0}%` }}
                              transition={{ duration: 0.6, delay: 0.1 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-5 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: AGE_COLORS.female }} /> Female
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: AGE_COLORS.male }} /> Male
                    </span>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
