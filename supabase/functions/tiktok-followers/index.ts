import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RAPIDAPI_KEY  = Deno.env.get('RAPIDAPI_KEY') || '';
const RAPIDAPI_HOST = 'tiktok-api23.p.rapidapi.com';
const BASE          = `https://${RAPIDAPI_HOST}`;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const RAPID_HEADERS = {
  'x-rapidapi-key':  RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
};

// deno-lint-ignore no-explicit-any
async function ttGet(path: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: RAPID_HEADERS });
  if (!res.ok) throw new Error(`TikTok API HTTP ${res.status} for ${path}`);
  return res.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!RAPIDAPI_KEY) return json({ error: 'RAPIDAPI_KEY not configured' }, 500);

    const body = await req.json().catch(() => ({}));
    const { handle } = body as { handle?: string };
    if (!handle) return json({ error: 'Provide handle' }, 400);

    const uniqueId = handle.replace(/^@/, '');

    // 1. Fetch user info → secUid, stats, nickname
    const infoRaw = await ttGet('/api/user/info', { uniqueId });

    // deno-lint-ignore no-explicit-any
    const userInfo: any = infoRaw?.userInfo;
    if (!userInfo) {
      console.error('[tiktok-followers] unexpected structure:', JSON.stringify(infoRaw).slice(0, 300));
      return json({ error: `TikTok creator @${uniqueId} not found` }, 404);
    }

    // deno-lint-ignore no-explicit-any
    const stats: any = userInfo.statsV2 ?? userInfo.stats ?? {};
    // deno-lint-ignore no-explicit-any
    const user: any  = userInfo.user ?? {};

    const followerCount  = parseInt(String(stats.followerCount  ?? 0), 10);
    const followingCount = parseInt(String(stats.followingCount ?? 0), 10);
    const videoCount     = parseInt(String(stats.videoCount     ?? 0), 10);
    const likeCount      = parseInt(String(stats.heart ?? stats.heartCount ?? 0), 10);
    const nickname       = user.nickname   ?? uniqueId;
    const avatarUrl      = user.avatarThumb ?? user.avatarMedium ?? null;
    const secUid         = user.secUid ?? '';

    // 2. Fetch recent posts for engagement (non-fatal)
    let posts: Array<{ id: string; likes: number; comments: number; views: number; cover: string | null }> = [];
    if (secUid) {
      try {
        const postsRaw = await ttGet('/api/user/posts', { secUid, count: '12', cursor: '0' });
        // deno-lint-ignore no-explicit-any
        const items: any[] = postsRaw?.itemList ?? postsRaw?.data?.itemList ?? [];
        posts = items.slice(0, 12).map((item: any) => ({
          id:       String(item.id ?? ''),
          likes:    item.stats?.diggCount    ?? 0,
          comments: item.stats?.commentCount ?? 0,
          views:    item.stats?.playCount    ?? 0,
          cover:    item.video?.cover        ?? null,
        }));
      } catch { /* non-fatal */ }
    }

    // 3. Fetch a sample of followers to derive audience country breakdown (non-fatal)
    // Each follower has a `region` (ISO 3166-1 alpha-2) field we aggregate into percentages.
    let followers: Array<{ uid: string; region: string }> = [];
    if (secUid) {
      try {
        const followersRaw = await ttGet('/api/user/followers', {
          secUid,
          count:   '100',
          minTime: '0',
        });

        // API may return userInfoList or users depending on version
        // deno-lint-ignore no-explicit-any
        const list: any[] =
          followersRaw?.userInfoList ??
          followersRaw?.users        ??
          followersRaw?.items        ??
          followersRaw?.data?.userInfoList ??
          [];

        followers = list
          // deno-lint-ignore no-explicit-any
          .map((f: any) => ({
            uid:    String(f.user?.uid    ?? f.uid    ?? ''),
            region: String(f.user?.region ?? f.region ?? '').toUpperCase(),
          }))
          .filter(f => f.region.length === 2); // only keep valid ISO codes

        console.log(`[tiktok-followers] fetched ${followers.length} followers with region data`);
      } catch (e) {
        // Non-fatal: followers endpoint may not be available on free plan
        console.warn('[tiktok-followers] followers fetch failed (non-fatal):', String(e));
      }
    }

    return json({
      total:        followerCount,
      followers,           // [{uid, region}] — ProfileEdit aggregates these into audience_locations
      has_more:     false,
      min_time:     null,
      max_time:     null,
      nickname,
      avatarUrl,
      following:    followingCount,
      videoCount,
      likeCount,
      region:       null,
      posts,
    });

  } catch (err) {
    console.error('[tiktok-followers] error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
