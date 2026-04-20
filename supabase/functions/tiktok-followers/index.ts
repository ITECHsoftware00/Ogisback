import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SCRAPE_KEY = Deno.env.get('SCRAPECREATORS_API_KEY') || '';
const BASE_URL   = 'https://api.scrapecreators.com/v1/tiktok/user/followers';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    if (!SCRAPE_KEY) {
      return json({ error: 'SCRAPECREATORS_API_KEY not configured' }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const { handle, user_id, min_time, trim = true } = body as {
      handle?:   string;
      user_id?:  string;
      min_time?: number;
      trim?:     boolean;
    };

    if (!handle && !user_id) {
      return json({ error: 'Provide handle or user_id' }, 400);
    }

    const params = new URLSearchParams({ trim: String(trim) });
    if (handle)   params.set('handle',   handle.replace(/^@/, ''));
    if (user_id)  params.set('user_id',  user_id);
    if (min_time) params.set('min_time', String(min_time));

    const upstream = await fetch(`${BASE_URL}?${params}`, {
      headers: { 'x-api-key': SCRAPE_KEY },
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => String(upstream.status));
      console.error('[tiktok-followers] upstream error:', upstream.status, errText);
      return json({ error: `Upstream error ${upstream.status}` }, upstream.status);
    }

    const data = await upstream.json();

    // API uses { success: true } — fall back to status_code check for older format
    const ok = data.success === true || data.status_code === 0;
    if (!ok) {
      return json({ error: data.status_msg || data.message || 'TikTok API error' }, 400);
    }

    const followers = (data.followers ?? []).map(normaliseFollower);

    // API returns min_time for cursor pagination; has_more inferred from page size
    const has_more = followers.length >= 50;

    return json({
      followers,
      has_more,
      min_time:         data.min_time         ?? null,
      credits_remaining: data.credits_remaining ?? null,
      total:            data.total             ?? 0,
    });

  } catch (err) {
    console.error('[tiktok-followers] unexpected error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// deno-lint-ignore no-explicit-any
function normaliseFollower(raw: any) {
  // API returns avatar_medium; fall back to avatar_thumb / avatar_168x168 for older shapes
  const avatarUrl =
    raw.avatar_medium?.url_list?.[0] ||
    raw.avatar_thumb?.url_list?.[0]  ||
    raw.avatar_168x168?.url_list?.[0] ||
    null;

  return {
    uid:            raw.uid             || raw.sec_uid     || '',
    handle:         raw.unique_id       || '',
    nickname:       raw.nickname        || '',
    avatar:         avatarUrl,
    bio:            raw.signature       || '',
    region:         raw.region          || '',
    followerCount:  raw.follower_count  ?? 0,
    followingCount: raw.following_count ?? 0,
    verified:       raw.verification_type === 2,
    isPrivate:      raw.secret === 1,
    createdAt:      raw.create_time     || null,
  };
}
