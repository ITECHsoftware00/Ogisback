/**
 * useInstagramData.js — Hook for accessing Instagram analytics data.
 *
 * CURRENT STATE (mock):
 *   Returns static mock data immediately. No network requests are made.
 *
 * TO SWAP IN REAL DATA when Meta App Review is approved:
 *   1. Delete (or comment out) the mock import and the early-return block
 *      marked  ── MOCK BLOCK ──  below.
 *   2. Uncomment the  ── REAL API BLOCK ──  section.
 *   3. Ensure the creator's Instagram access token is stored in Supabase
 *      (e.g. creator_profiles.instagram_access_token).
 *   4. The hook signature and returned shape stay identical — no UI changes needed.
 */

import { useState, useEffect } from 'react';
import { mockInstagramData } from '../data/mockInstagramData';

/**
 * @param {string|null} creatorId - The creator's Supabase user ID.
 *                                  Accepted now so callers don't need to change
 *                                  their interface when real data is wired up.
 * @returns {{
 *   data:    import('../types/instagram').InstagramData | null,
 *   loading: boolean,
 *   error:   Error | null,
 * }}
 */
export function useInstagramData(creatorId) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!creatorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        /* ─────────────────────────────────────────────────────────
         * ── MOCK BLOCK ── Remove this block when going live ──────
         * ─────────────────────────────────────────────────────────
         * Simulates a short network delay so loading states render. */
        await delay(420);
        if (!cancelled) setData(mockInstagramData);
        /* ──────────────────────────────────────────────────────── */

        /* ─────────────────────────────────────────────────────────
         * ── REAL API BLOCK ── Uncomment when Meta approves app ───
         * ─────────────────────────────────────────────────────────
        const { data: profile, error: dbErr } = await supabase
          .from('creator_profiles')
          .select('instagram_access_token, instagram')
          .eq('id', creatorId)
          .maybeSingle();

        if (dbErr || !profile?.instagram_access_token) {
          throw new Error('Instagram not connected or token missing.');
        }

        const token = profile.instagram_access_token;
        const igUserId = profile.instagram; // stored as IG user ID at connect time

        // Fetch profile + media count
        const profileRes = await fetch(
          `https://graph.instagram.com/${igUserId}` +
          `?fields=username,name,profile_picture_url,followers_count,follows_count,media_count` +
          `&access_token=${token}`
        );
        const igProfile = await profileRes.json();

        // Fetch account insights (reach, impressions, profile_views — last 30 days)
        const since = Math.floor(Date.now() / 1000) - 30 * 86400;
        const insightsRes = await fetch(
          `https://graph.instagram.com/${igUserId}/insights` +
          `?metric=reach,impressions,profile_views&period=days_28&since=${since}` +
          `&access_token=${token}`
        );
        const igInsights = await insightsRes.json();

        // Fetch recent 6 media
        const mediaRes = await fetch(
          `https://graph.instagram.com/${igUserId}/media` +
          `?fields=id,media_type,thumbnail_url,media_url,caption,like_count,comments_count,timestamp&limit=6` +
          `&access_token=${token}`
        );
        const igMedia = await mediaRes.json();

        // TODO: fetch audience demographics via /insights?metric=audience_gender_age,audience_country
        // Requires `instagram_manage_insights` permission (needs App Review)

        const liveData = transformIgApiResponse(igProfile, igInsights, igMedia);
        if (!cancelled) setData(liveData);
         * ──────────────────────────────────────────────────────── */

      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [creatorId]);

  return { data, loading, error };
}

/* ── helpers ─────────────────────────────────────────────────── */

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Transform raw Instagram Graph API response into InstagramData shape.
 * Only used in the real API block above — kept here so the swap is self-contained.
 *
 * @param {object} igProfile
 * @param {object} igInsights
 * @param {object} igMedia
 * @returns {import('../types/instagram').InstagramData}
 */
// eslint-disable-next-line no-unused-vars
function transformIgApiResponse(igProfile, igInsights, igMedia) {
  const getMetric = (name) =>
    igInsights?.data?.find(m => m.name === name)?.values?.slice(-1)[0]?.value ?? 0;

  return {
    source:    'live',
    fetchedAt: new Date().toISOString(),
    profile: {
      username:           igProfile.username        || '',
      displayName:        igProfile.name            || '',
      profilePictureUrl:  igProfile.profile_picture_url || null,
      followerCount:      igProfile.followers_count  || 0,
      followingCount:     igProfile.follows_count    || 0,
      mediaCount:         igProfile.media_count      || 0,
      engagementRate:     0, // compute from recent posts if needed
    },
    insights: {
      reach:        getMetric('reach'),
      impressions:  getMetric('impressions'),
      profileViews: getMetric('profile_views'),
    },
    audience: {
      ageRanges:    [],
      gender:       { female: 0, male: 0, other: 0 },
      topCountries: [],
    },
    recentPosts: (igMedia?.data || []).map(p => ({
      id:           p.id,
      mediaType:    (p.media_type || 'IMAGE').toLowerCase(),
      thumbnailUrl: p.thumbnail_url || p.media_url || null,
      caption:      p.caption || '',
      likes:        p.like_count    || 0,
      comments:     p.comments_count || 0,
      reach:        0,
      impressions:  0,
      postedAt:     p.timestamp || new Date().toISOString(),
    })),
  };
}
