import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH     = 'https://graph.facebook.com/v19.0';
const SUPA_URL  = Deno.env.get('SUPABASE_URL')                 || '';
const SERVICE   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')    || '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { userId } = await req.json().catch(() => ({}));
    if (!userId) return json({ error: 'userId required' }, 400);
    if (!SUPA_URL || !SERVICE) return json({ error: 'Supabase service role not configured' }, 500);

    const sb = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

    const { data: profile, error: profileErr } = await sb
      .from('creator_profiles')
      .select('instagram_business_id, instagram_page_token')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) return json({ error: profileErr.message }, 500);
    if (!profile?.instagram_business_id || !profile?.instagram_page_token) {
      return json({ error: 'Instagram Business not connected' }, 400);
    }

    const igId  = profile.instagram_business_id;
    const token = profile.instagram_page_token;

    // Single call, three metrics
    const url = `${GRAPH}/${encodeURIComponent(igId)}/insights`
      + `?metric=audience_city,audience_country,audience_gender_age`
      + `&period=lifetime`
      + `&access_token=${encodeURIComponent(token)}`;

    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      const msg  = data?.error?.message || `Graph API HTTP ${res.status}`;
      const code = data?.error?.code;
      console.error('[instagram-audience] Graph error:', JSON.stringify(data).slice(0, 400));
      return json({ error: msg, code }, 400);
    }

    // deno-lint-ignore no-explicit-any
    const metrics: any[] = data?.data || [];
    const byName = (n: string) => metrics.find(m => m.name === n)?.values?.[0]?.value || {};

    const rawCities:    Record<string, number> = byName('audience_city');
    const rawCountries: Record<string, number> = byName('audience_country');
    const rawAgeGender: Record<string, number> = byName('audience_gender_age');

    const cities = toSortedTop(rawCities, 10);
    const countries = toSortedTop(rawCountries, 10).map(d => ({ country: d.label, percent: d.percent }));
    const citiesShaped = cities.map(d => ({ city: d.label, percent: d.percent }));
    const ageGender = reshapeAgeGender(rawAgeGender);

    // Persist snapshot
    await sb.from('creator_profiles').update({
      instagram_audience_cities:     citiesShaped,
      instagram_audience_countries:  countries,
      instagram_audience_age_gender: ageGender,
      instagram_audience_last_sync:  new Date().toISOString(),
    }).eq('id', userId);

    return json({ cities: citiesShaped, countries, ageGender });

  } catch (err) {
    console.error('[instagram-audience] error:', err);
    return json({ error: String(err) }, 500);
  }
});

function toSortedTop(obj: Record<string, number>, n: number) {
  return Object.entries(obj || {})
    .map(([label, percent]) => ({ label, percent: Math.round(Number(percent) * 10) / 10 }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, n);
}

/** Graph returns keys like "F.18-24", "M.18-24". Collapse to [{ range, female, male }]. */
function reshapeAgeGender(obj: Record<string, number>) {
  const buckets: Record<string, { female: number; male: number }> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const [g, range] = k.split('.');
    if (!range) continue;
    buckets[range] ||= { female: 0, male: 0 };
    if (g === 'F') buckets[range].female += Number(v) || 0;
    if (g === 'M') buckets[range].male   += Number(v) || 0;
    // 'U' (undisclosed) is dropped — rare and noisy
  }
  // Convert raw counts/percents into percent-of-total
  const total = Object.values(buckets).reduce((s, b) => s + b.female + b.male, 0) || 1;
  return Object.entries(buckets)
    .map(([range, b]) => ({
      range,
      female: Math.round((b.female / total) * 1000) / 10,
      male:   Math.round((b.male   / total) * 1000) / 10,
    }))
    .sort((a, b) => ageKey(a.range) - ageKey(b.range));
}

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
