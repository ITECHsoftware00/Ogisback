import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CLIENT_KEY    = Deno.env.get('TIKTOK_CLIENT_KEY')    || '';
const CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET') || '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { code, redirectUri } = await req.json();
    if (!code || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing code or redirectUri' }), { status: 400, headers: CORS });
    }

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key:    CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Token exchange failed', detail: tokenData }), { status: 400, headers: CORS });
    }

    // 2. Fetch user info (follower_count requires user.info.profile scope)
    const userRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,follower_count,following_count,likes_count,video_count,avatar_url',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const userData = await userRes.json();
    const info = userData?.data?.user;

    return new Response(JSON.stringify({
      username:       info?.username       || '',
      displayName:    info?.display_name   || '',
      followerCount:  info?.follower_count || 0,
      followingCount: info?.following_count || 0,
      likesCount:     info?.likes_count    || 0,
      videoCount:     info?.video_count    || 0,
      avatarUrl:      info?.avatar_url     || '',
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
