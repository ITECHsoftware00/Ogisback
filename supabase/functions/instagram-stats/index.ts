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

    const res = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(clean)}`,
      {
        headers: {
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
          'x-rapidapi-key':  RAPIDAPI_KEY,
        },
      }
    );

    const json = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: json?.message || 'API error', status: res.status }), { status: 400, headers: CORS });
    }

    const user = json?.data;
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: CORS });
    }

    return new Response(JSON.stringify({
      username:      user.username        || clean,
      followers:     user.follower_count  || 0,
      following:     user.following_count || 0,
      posts:         user.media_count     || 0,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
