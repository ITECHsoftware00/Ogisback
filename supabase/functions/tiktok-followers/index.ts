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
  if (!res.ok) throw new Error(`TikTok API HTTP ${res.status}`);
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

    // Fetch user info
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

    // Fetch recent posts to compute engagement (non-fatal)
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
      } catch { /* non-fatal — posts unavailable */ }
    }

    return json({
      total:        followerCount,
      followers:    [],
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
