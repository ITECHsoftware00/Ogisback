const YT_KEY         = import.meta.env.VITE_YOUTUBE_API_KEY;
const TT_CLIENT_KEY  = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
const FB_APP_ID      = import.meta.env.VITE_FACEBOOK_APP_ID;
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
  const res  = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    const reason = json?.error?.errors?.[0]?.reason || '';
    const msg    = json?.error?.message || String(res.status);
    console.error('[YouTube API] error:', msg, reason);
    // Surface quota/key errors so callers can show the right message
    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') throw new Error('quota');
    if (reason === 'keyInvalid' || res.status === 400) throw new Error('keyInvalid');
    return null;
  }
  return json;
}

export async function fetchYouTubeStats(handle) {
  if (!YT_KEY) throw new Error('noKey');
  if (!handle) return null;
  const raw       = handle.trim();
  const withAt    = raw.startsWith('@') ? raw : `@${raw}`;
  const withoutAt = raw.replace(/^@/, '');

  // 1. Try forHandle with @ prefix (current YouTube API standard)
  let json  = await ytFetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&forHandle=${encodeURIComponent(withAt)}&key=${YT_KEY}`
  );
  let channel = json?.items?.[0];

  // 2. Fallback: forUsername (legacy channels without handles)
  if (!channel) {
    json    = await ytFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&forUsername=${encodeURIComponent(withoutAt)}&key=${YT_KEY}`
    );
    channel = json?.items?.[0];
  }

  // 3. Fallback: search by name and grab first channel result
  if (!channel) {
    const searchJson = await ytFetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(withoutAt)}&maxResults=1&key=${YT_KEY}`
    );
    const channelId = searchJson?.items?.[0]?.snippet?.channelId;
    if (channelId) {
      json    = await ytFetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${channelId}&key=${YT_KEY}`
      );
      channel = json?.items?.[0];
    }
  }

  if (!channel) return null;

  const stats       = channel.statistics;
  const uploadsId   = channel.contentDetails?.relatedPlaylists?.uploads;
  const subscribers = parseInt(stats.subscriberCount) || 0;

  let avgLikes    = 0;
  let avgComments = 0;
  let engRate     = 0;

  // Fetch last 10 videos and calculate averages
  if (uploadsId) {
    const playlistJson = await ytFetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=10&key=${YT_KEY}`
    ).catch(() => null);

    const videoIds = (playlistJson?.items || [])
      .map(i => i.contentDetails?.videoId)
      .filter(Boolean);

    if (videoIds.length > 0) {
      const videoJson = await ytFetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${YT_KEY}`
      ).catch(() => null);

      const videoStats = (videoJson?.items || []).map(v => v.statistics);
      if (videoStats.length > 0) {
        avgLikes    = Math.round(videoStats.reduce((s, v) => s + (parseInt(v.likeCount)    || 0), 0) / videoStats.length);
        avgComments = Math.round(videoStats.reduce((s, v) => s + (parseInt(v.commentCount) || 0), 0) / videoStats.length);
        engRate     = subscribers > 0
          ? parseFloat(((avgLikes + avgComments) / subscribers * 100).toFixed(2))
          : 0;
      }
    }
  }

  return {
    subscribers,
    views:       parseInt(stats.viewCount)   || 0,
    videoCount:  parseInt(stats.videoCount)  || 0,
    avgLikes,
    avgComments,
    engRate,
  };
}

export function getFacebookAuthUrl(redirectUri) {
  const state = crypto.randomUUID();
  sessionStorage.setItem('fb_oauth_state', state);
  const params = new URLSearchParams({
    client_id:     FB_APP_ID,
    redirect_uri:  redirectUri,
    scope:         'pages_show_list,pages_read_engagement,instagram_basic',
    state,
    response_type: 'code',
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export async function exchangeFacebookCode(code, redirectUri) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/facebook-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirectUri }),
  });
  if (!res.ok) return null;
  return await res.json();
}
