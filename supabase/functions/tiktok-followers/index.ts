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

    // 3. Fetch a larger sample of followers (up to 500+) to derive audience country breakdown.
    // Each follower has a `region` (ISO 3166-1 alpha-2) field we aggregate into percentages.
    // Paginate through up to 5 pages of 100 followers each for statistical accuracy.
    let followers: Array<{ uid: string; region: string }> = [];
    if (secUid) {
      const MAX_PAGES   = 5;
      const PER_PAGE    = '100';
      let cursor        = '0';
      let hasMore       = true;

      for (let page = 0; page < MAX_PAGES && hasMore; page++) {
        try {
          const followersRaw = await ttGet('/api/user/followers', {
            secUid,
            count:   PER_PAGE,
            minTime: cursor,
          });

          // API may return userInfoList or users depending on version
          // deno-lint-ignore no-explicit-any
          const list: any[] =
            followersRaw?.userInfoList ??
            followersRaw?.users        ??
            followersRaw?.items        ??
            followersRaw?.data?.userInfoList ??
            [];

          const batch = list
            // deno-lint-ignore no-explicit-any
            .map((f: any) => ({
              uid:    String(f.user?.uid    ?? f.uid    ?? ''),
              region: String(f.user?.region ?? f.region ?? '').toUpperCase(),
            }))
            .filter(f => f.region.length === 2); // only keep valid ISO codes

          followers = [...followers, ...batch];

          // Determine cursor for next page
          hasMore = followersRaw?.hasMore ?? followersRaw?.has_more ?? (list.length >= 100);
          const nextCursor = followersRaw?.minTime ?? followersRaw?.min_time ?? followersRaw?.cursor;
          if (nextCursor && String(nextCursor) !== cursor) {
            cursor = String(nextCursor);
          } else {
            hasMore = false; // no new cursor → stop pagination
          }

          console.log(`[tiktok-followers] page ${page + 1}: fetched ${batch.length} followers (total: ${followers.length})`);

          // Brief delay between pages to avoid rate-limiting
          if (hasMore && page < MAX_PAGES - 1) {
            await new Promise(r => setTimeout(r, 300));
          }
        } catch (e) {
          // Non-fatal: stop pagination on error but keep what we have
          console.warn(`[tiktok-followers] followers page ${page + 1} failed (non-fatal):`, String(e));
          hasMore = false;
        }
      }

      console.log(`[tiktok-followers] total followers with region data: ${followers.length}`);
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
