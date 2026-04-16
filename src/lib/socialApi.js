const YT_KEY         = import.meta.env.VITE_YOUTUBE_API_KEY;
const TT_CLIENT_KEY  = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL;

async function generatePKCE() {
  const verifier = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const encoder  = new TextEncoder();
  const data     = encoder.encode(verifier);
  const digest   = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { verifier, challenge };
}

export async function getTikTokAuthUrl(redirectUri) {
  const state = crypto.randomUUID();
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem('tt_oauth_state',    state);
  sessionStorage.setItem('tt_code_verifier',  verifier);
  const params = new URLSearchParams({
    client_key:            TT_CLIENT_KEY,
    response_type:         'code',
    scope:                 'user.info.basic,user.info.profile',
    redirect_uri:          redirectUri,
    state,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  });
  return `https://www.tiktok.com/v2/auth/authorize?${params}`;
}

export async function exchangeTikTokCode(code, redirectUri) {
  const codeVerifier = sessionStorage.getItem('tt_code_verifier') || '';
  const res = await fetch(`${SUPABASE_URL}/functions/v1/tiktok-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri, codeVerifier }),
  });
  if (!res.ok) return null;
  return await res.json();
}

async function ytFetch(url) {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    console.error('[YouTube API] error:', json?.error?.message || res.status);
    return null;
  }
  return json;
}

export async function fetchYouTubeStats(handle) {
  if (!YT_KEY || !handle) return null;
  const raw = handle.trim();
  const withAt    = raw.startsWith('@') ? raw : `@${raw}`;
  const withoutAt = raw.replace(/^@/, '');

  try {
    // 1. Try forHandle with @ prefix (current YouTube API standard)
    let json = await ytFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(withAt)}&key=${YT_KEY}`
    );
    let stats = json?.items?.[0]?.statistics;

    // 2. Fallback: forUsername (legacy channels without handles)
    if (!stats) {
      json = await ytFetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&forUsername=${encodeURIComponent(withoutAt)}&key=${YT_KEY}`
      );
      stats = json?.items?.[0]?.statistics;
    }

    // 3. Fallback: search by name and grab first channel result
    if (!stats) {
      const searchJson = await ytFetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(withoutAt)}&maxResults=1&key=${YT_KEY}`
      );
      const channelId = searchJson?.items?.[0]?.snippet?.channelId;
      if (channelId) {
        json = await ytFetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YT_KEY}`
        );
        stats = json?.items?.[0]?.statistics;
      }
    }

    if (!stats) return null;
    return {
      subscribers: parseInt(stats.subscriberCount) || 0,
      views:       parseInt(stats.viewCount)        || 0,
      videoCount:  parseInt(stats.videoCount)       || 0,
    };
  } catch (err) {
    console.error('[YouTube API] fetch failed:', err);
    return null;
  }
}
