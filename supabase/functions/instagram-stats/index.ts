import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY') || '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { username } = await req.json();
    if (!username) {
      return new Response(JSON.stringify({ error: 'Missing username' }), { status: 400, headers: CORS });
    }
    if (!RAPIDAPI_KEY) {
      return new Response(JSON.stringify({ error: 'noKey' }), { status: 500, headers: CORS });
    }

    const clean = username.replace(/^@/, '');
    const igUrl = `https://www.instagram.com/${clean}/`;

    const body = new URLSearchParams({ username_or_url: igUrl });

    const res = await fetch(
      'https://instagram-scraper-stable-api.p.rapidapi.com/v1/info',
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/x-www-form-urlencoded',
          'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
          'x-rapidapi-key':  RAPIDAPI_KEY,
        },
        body,
      }
    );

    const json = await res.json();
    console.log('[instagram-stats] response:', JSON.stringify(json).slice(0, 300));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: json?.message || 'API error', status: res.status }), { status: 400, headers: CORS });
    }

    // Handle various response shapes from this API
    const user = json?.data?.user ?? json?.data ?? json?.user ?? json;
    const followers = user?.follower_count ?? user?.edge_followed_by?.count ?? user?.followers ?? 0;

    if (!followers && !user?.username) {
      return new Response(JSON.stringify({ error: 'User not found', raw: json }), { status: 404, headers: CORS });
    }

    return new Response(JSON.stringify({
      username:  user?.username || clean,
      followers: followers      || 0,
      following: user?.following_count ?? user?.edge_follow?.count ?? 0,
      posts:     user?.media_count ?? 0,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
