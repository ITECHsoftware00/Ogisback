/**
 * youtube-audience — Fetch city-level audience insights via YouTube Analytics API
 *
 * Data pipeline:
 * ┌─────────────────────┬──────────────────────────────────────────────────────────────┐
 * │ Step                │ Details                                                      │
 * ├─────────────────────┼──────────────────────────────────────────────────────────────┤
 * │ 1. Auth             │ youtube-auth stores refresh_token → creator_profiles         │
 * │ 2. Token refresh    │ POST oauth2.googleapis.com/token → short-lived access_token  │
 * │ 3. City insights    │ GET youtubeanalytics.googleapis.com/v2/reports               │
 * │                     │   ?ids=channel==MINE                                         │
 * │                     │   &dimensions=city                                           │
 * │                     │   &metrics=views,estimatedMinutesWatched                     │
 * │                     │   &sort=-views&maxResults=15                                 │
 * │ 4. Response rows    │ [["Lagos", 45230, 91000], ["London", 12100, 24300], ...]      │
 * │ 5. Stored as        │ { city: "Lagos", percent: 42.1 }  → youtube_audience_cities  │
 * │ 6. Age/gender       │ GET same endpoint with dimensions=ageGroup,gender             │
 * │                     │   → [{ range: "18-24", female: 38.2, male: 51.1 }]           │
 * └─────────────────────┴──────────────────────────────────────────────────────────────┘
 *
 * Requires: GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET (Supabase secrets)
 * Minimum threshold: YouTube suppresses cities with < ~1,000 views (privacy policy)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_CLIENT_ID     = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')     || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET') || '';
const SUPA_URL             = Deno.env.get('SUPABASE_URL')               || '';
const SERVICE              = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')   || '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { userId } = await req.json().catch(() => ({}));
    if (!userId) return json({ error: 'userId required' }, 400);

    const sb = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

    // 1. Get stored refresh token
    const { data: profile, error: profileErr } = await sb
      .from('creator_profiles')
      .select('youtube_refresh_token')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) return json({ error: profileErr.message }, 500);
    if (!profile?.youtube_refresh_token) {
      return json({ error: 'YouTube Analytics not connected. Connect via Profile Settings.' }, 400);
    }

    // 2. Refresh the access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: profile.youtube_refresh_token,
        grant_type:    'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      console.error('[youtube-audience] token refresh error:', JSON.stringify(tokenData).slice(0, 400));
      return json({ error: 'Failed to refresh YouTube token. Please reconnect.' }, 401);
    }

    const accessToken = tokenData.access_token;

    // 3. YouTube Analytics API — use channel==MINE (no Data API v3 needed)
    const endDate   = new Date().toISOString().split('T')[0];
    const startDate = '2020-01-01';

    // Fetch city-level audience data
    const countryUrl = `https://youtubeanalytics.googleapis.com/v2/reports`
      + `?ids=channel==MINE`
      + `&startDate=${startDate}&endDate=${endDate}`
      + `&metrics=views,estimatedMinutesWatched`
      + `&dimensions=city`
      + `&sort=-views`
      + `&maxResults=15`;

    const countryRes = await fetch(countryUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const countryData = await countryRes.json();
    if (!countryRes.ok) {
      console.error('[youtube-audience] city query error:', JSON.stringify(countryData).slice(0, 400));
      return json({ error: countryData?.error?.message || 'YouTube Analytics API error' }, 502);
    }

    // Fetch age/gender demographics
    const ageGenderUrl = `https://youtubeanalytics.googleapis.com/v2/reports`
      + `?ids=channel==MINE`
      + `&startDate=${startDate}&endDate=${endDate}`
      + `&metrics=viewerPercentage`
      + `&dimensions=ageGroup,gender`
      + `&sort=ageGroup`;

    const ageGenderRes = await fetch(ageGenderUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const ageGenderData = await ageGenderRes.json();

    // 5. Parse city data (dimensions=city returns city names as strings)
    // deno-lint-ignore no-explicit-any
    const countryRows: any[] = countryData?.rows || [];
    const totalViews = countryRows.reduce((s: number, r: number[]) => s + (r[1] || 0), 0) || 1;
    const countries = countryRows.slice(0, 10).map((r: number[]) => ({
      city:    String(r[0]),   // city name e.g. "Lagos", "London"
      percent: Math.round((Number(r[1]) / totalViews) * 1000) / 10,
    }));

    // 6. Parse age/gender data
    // Rows: [ageGroup, gender, viewerPercentage]
    // deno-lint-ignore no-explicit-any
    const agRows: any[] = ageGenderData?.rows || [];
    const buckets: Record<string, { female: number; male: number }> = {};
    for (const row of agRows) {
      const ageGroup = String(row[0]).replace('age', '');
      const gender   = String(row[1]).toLowerCase();
      const pct      = Number(row[2]) || 0;
      buckets[ageGroup] ||= { female: 0, male: 0 };
      if (gender === 'female') buckets[ageGroup].female += pct;
      if (gender === 'male')   buckets[ageGroup].male   += pct;
    }
    const ageGender = Object.entries(buckets)
      .map(([range, b]) => ({
        range,
        female: Math.round(b.female * 10) / 10,
        male:   Math.round(b.male   * 10) / 10,
      }))
      .sort((a, b) => ageKey(a.range) - ageKey(b.range));

    // 7. Persist snapshot
    await sb.from('creator_profiles').update({
      youtube_audience_countries:  countries,
      youtube_audience_age_gender: ageGender,
      youtube_audience_last_sync:  new Date().toISOString(),
    }).eq('id', userId);

    return json({ countries, ageGender });

  } catch (err) {
    console.error('[youtube-audience] error:', err);
    return json({ error: String(err) }, 500);
  }
});

function ageKey(r: string) {
  const n = parseInt(r.split('-')[0], 10);
  return isNaN(n) ? 999 : n;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
