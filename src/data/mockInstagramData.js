/**
 * mockInstagramData.js — Realistic fake Instagram analytics for a mid-tier
 * creator (10k–50k followers range).
 *
 * Replace this entire file's export with a live API response once
 * Meta App Review is approved and the Instagram Graph API is wired up.
 *
 * @returns {import('../types/instagram').InstagramData}
 */

/** @type {import('../types/instagram').InstagramData} */
export const mockInstagramData = {
  source: 'mock',
  fetchedAt: new Date().toISOString(),

  /* ── Profile ──────────────────────────────────────────────── */
  profile: {
    username:           'halimoladimeji92086',
    displayName:        'Halim Oladimeji',
    profilePictureUrl:  null, // pulled from creator profile in real impl
    followerCount:      34_820,
    followingCount:     1_204,
    mediaCount:         287,
    engagementRate:     4.7, // %
  },

  /* ── 30-day account insights ──────────────────────────────── */
  insights: {
    reach:        58_400,
    impressions:  142_600,
    profileViews: 3_870,
  },

  /* ── Audience demographics ────────────────────────────────── */
  audience: {
    ageRanges: [
      { range: '13-17', percent: 3  },
      { range: '18-24', percent: 31 },
      { range: '25-34', percent: 38 },
      { range: '35-44', percent: 18 },
      { range: '45-54', percent: 7  },
      { range: '55+',   percent: 3  },
    ],
    gender: {
      female: 62,
      male:   36,
      other:  2,
    },
    topCities: [
      { city: 'Lagos, Nigeria',        percent: 28 },
      { city: 'London, UK',            percent: 17 },
      { city: 'New York, US',          percent: 14 },
      { city: 'Dubai, UAE',            percent: 11 },
      { city: 'Nairobi, Kenya',        percent:  9 },
    ],
    ageGender: [
      { range: '13-17', female: 4,  male: 3  },
      { range: '18-24', female: 22, male: 18 },
      { range: '25-34', female: 19, male: 14 },
      { range: '35-44', female: 10, male:  6 },
      { range: '45-54', female:  3, male:  1 },
    ],
  },

  /* ── Last 6 posts ─────────────────────────────────────────── */
  recentPosts: [
    {
      id:           'mock-post-1',
      mediaType:    'image',
      thumbnailUrl: null,
      caption:      'Behind the scenes of our latest brand shoot 🎬 — loving how this campaign came together!',
      likes:        1_842,
      comments:     94,
      reach:        12_300,
      impressions:  18_740,
      postedAt:     daysAgo(1),
    },
    {
      id:           'mock-post-2',
      mediaType:    'carousel',
      thumbnailUrl: null,
      caption:      'My morning routine 🌅 — swipe to see the full breakdown. Which step surprised you?',
      likes:        2_310,
      comments:     187,
      reach:        19_850,
      impressions:  31_200,
      postedAt:     daysAgo(4),
    },
    {
      id:           'mock-post-3',
      mediaType:    'video',
      thumbnailUrl: null,
      caption:      'POV: you finally land your first paid collab 💸 Save this if you\'re still waiting for yours.',
      likes:        3_120,
      comments:     243,
      reach:        28_400,
      impressions:  47_600,
      postedAt:     daysAgo(7),
    },
    {
      id:           'mock-post-4',
      mediaType:    'image',
      thumbnailUrl: null,
      caption:      'Product drop with @ogisback — use code HALIM15 for 15% off! Limited stock 🔥',
      likes:        986,
      comments:     72,
      reach:        8_900,
      impressions:  13_200,
      postedAt:     daysAgo(12),
    },
    {
      id:           'mock-post-5',
      mediaType:    'carousel',
      thumbnailUrl: null,
      caption:      '5 things no one tells you about creator life (the real ones 👇)',
      likes:        2_740,
      comments:     311,
      reach:        22_100,
      impressions:  38_500,
      postedAt:     daysAgo(17),
    },
    {
      id:           'mock-post-6',
      mediaType:    'image',
      thumbnailUrl: null,
      caption:      'Grateful for every single one of you 🙏 30k felt impossible a year ago.',
      likes:        4_560,
      comments:     528,
      reach:        31_700,
      impressions:  52_300,
      postedAt:     daysAgo(23),
    },
  ],
};

/* ── helpers (not exported) ─────────────────────────────────── */

/** Returns an ISO date string N days in the past. */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
