import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const KEYAPI_KEY = Deno.env.get('KEYAPI_KEY') || '';
const TT_MCP_URL = 'https://mcp.keyapi.ai/tiktok/mcp';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// deno-lint-ignore no-explicit-any
async function ttCall(tool: string, args: Record<string, unknown>): Promise<any> {
  const res = await fetch(TT_MCP_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYAPI_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id:      1,
      method:  'tools/call',
      params:  { name: tool, arguments: args },
    }),
  });
  if (!res.ok) throw new Error(`KeyAPI HTTP ${res.status}`);
  const rpc = await res.json();
  if (rpc.error) throw new Error(rpc.error.message || 'KeyAPI RPC error');
  const text = rpc.result?.content?.[0]?.text;
  if (!text) throw new Error('Empty KeyAPI response');
  return JSON.parse(text);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!KEYAPI_KEY) return json({ error: 'KEYAPI_KEY not configured' }, 500);

    const body = await req.json().catch(() => ({}));
    const { handle } = body as { handle?: string; user_id?: string };
    if (!handle) return json({ error: 'Provide handle' }, 400);

    const uniqueId = handle.replace(/^@/, '');

    // Fetch profile details and region in parallel
    const [detailRaw, regionRaw] = await Promise.all([
      ttCall('get_influencer_detail', { unique_id: uniqueId }),
      ttCall('get_influencer_region', { unique_id: uniqueId }).catch(() => null),
    ]);

    // get_influencer_detail → { data: { status_code, user: {...} } }
    const parsed = detailRaw?.data ?? detailRaw;
    const user   = parsed?.user ?? parsed;

    if (!user || !user.follower_count === undefined) {
      console.error('[tiktok-followers] unexpected structure:', JSON.stringify(detailRaw).slice(0, 300));
      return json({ error: `TikTok creator @${uniqueId} not found` }, 404);
    }

    const followerCount  = user.follower_count  ?? user.fans_count ?? 0;
    const followingCount = user.following_count ?? 0;
    const videoCount     = user.aweme_count     ?? 0;
    const likeCount      = user.total_favorited ?? user.favoriting_count ?? 0;
    const nickname       = user.nickname        ?? uniqueId;
    const avatarUrl      = user.avatar_thumb?.url_list?.[0] || user.avatar_168x168?.url_list?.[0] || null;
    const region         = regionRaw?.data ?? null;

    return json({
      total:            followerCount,
      followers:        [],
      has_more:         false,
      min_time:         null,
      max_time:         null,
      nickname,
      avatarUrl,
      following:        followingCount,
      videoCount,
      likeCount,
      region,
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
