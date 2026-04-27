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
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return json({ error: 'Google OAuth credentials not configured' }, 500);
    }

    const { code, redirectUri, userId } = await req.json().catch(() => ({}));
    if (!code || !redirectUri) return json({ error: 'code and redirectUri required' }, 400);
    if (!userId)               return json({ error: 'userId required' }, 400);

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      console.error('[youtube-auth] token exchange error:', JSON.stringify(tokenData).slice(0, 400));
      return json({ error: tokenData.error_description || tokenData.error || 'Token exchange failed' }, 400);
    }

    const { access_token, refresh_token } = tokenData;

    // 2. Fetch the authenticated user's YouTube channel info
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    const channelData = await channelRes.json();
    const channel = channelData?.items?.[0];

    if (!channel) {
      return json({ error: 'No YouTube channel found for this Google account' }, 404);
    }

    const subscribers  = parseInt(channel.statistics?.subscriberCount || '0', 10);
    const views        = parseInt(channel.statistics?.viewCount       || '0', 10);
    const videoCount   = parseInt(channel.statistics?.videoCount      || '0', 10);
    const channelTitle = channel.snippet?.title   || '';
    const country      = channel.snippet?.country || null;
    const handle       = channel.snippet?.customUrl?.replace(/^@/, '') || channelTitle;

    // 3. Persist the refresh token and channel info
    const sb = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });

    await sb.from('creator_profiles').update({
      youtube:               handle,
      youtube_followers:     subscribers,
      youtube_refresh_token: refresh_token,
    }).eq('id', userId);

    return json({
      connected: true,
      handle,
      subscribers,
      views,
      videoCount,
      channelTitle,
      country,
    });

  } catch (err) {
    console.error('[youtube-auth] error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
