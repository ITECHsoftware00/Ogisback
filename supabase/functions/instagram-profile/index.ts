import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const KEYAPI_KEY = Deno.env.get('KEYAPI_KEY') || '';
const IG_MCP_URL = 'https://mcp.keyapi.ai/instagram/mcp';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// deno-lint-ignore no-explicit-any
async function igCall(tool: string, args: Record<string, unknown>): Promise<any> {
  const res = await fetch(IG_MCP_URL, {
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
  const parsed = JSON.parse(text);
  if (parsed.code !== 0) throw new Error(parsed.message || `API error code ${parsed.code}`);
  // Instagram returns { data: { data: { ...user } } }
  return parsed.data?.data ?? parsed.data ?? parsed;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!KEYAPI_KEY) return json({ error: 'KEYAPI_KEY not configured' }, 500);

    const body = await req.json().catch(() => ({}));
    const { handle } = body as { handle?: string };
    if (!handle) return json({ error: 'Provide handle' }, 400);

    const username = handle.replace(/^@/, '');

    // Fetch profile and posts in parallel
    const [u, postsRaw] = await Promise.all([
      igCall('get_user_info', { username }),
      igCall('get_user_posts', { username }).catch(() => null),
    ]);

    if (!u) return json({ error: 'Could not read Instagram profile data' }, 502);

    // Posts are under data.items or data.data.items
    const rawItems: any[] = postsRaw?.items ?? postsRaw?.data?.items ?? [];

    const posts = rawItems.slice(0, 12).map((item: any) => {
      const isVideo    = item.media_type === 2;
      const isCarousel = item.media_type === 8;
      const thumbnailUrl =
        item.thumbnail_url ||
        item.image_versions2?.candidates?.[0]?.url ||
        item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ||
        null;
      return {
        id:           String(item.pk || item.id || ''),
        shortcode:    item.code  || '',
        mediaType:    isVideo ? 'video' : (isCarousel ? 'carousel' : 'image'),
        thumbnailUrl,
        caption:      item.caption?.text || '',
        likes:        item.like_count    ?? 0,
        comments:     item.comment_count ?? 0,
        views:        item.play_count    ?? item.view_count ?? 0,
        postedAt:     item.taken_at
          ? new Date(item.taken_at * 1000).toISOString()
          : new Date().toISOString(),
      };
    });

    const followerCount = u.follower_count ?? u.edge_followed_by?.count ?? 0;

    let engagementRate = 0;
    if (posts.length > 0 && followerCount > 0) {
      const sumLikes    = posts.reduce((s: number, p: any) => s + p.likes,    0);
      const sumComments = posts.reduce((s: number, p: any) => s + p.comments, 0);
      engagementRate = parseFloat((((sumLikes + sumComments) / posts.length) / followerCount * 100).toFixed(2));
    }

    const avgLikes    = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + p.likes,    0) / posts.length) : 0;
    const avgComments = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + p.comments, 0) / posts.length) : 0;

    return json({
      profile: {
        username:          u.username        || username,
        displayName:       u.full_name       || '',
        profilePictureUrl: u.profile_pic_url || u.hd_profile_pic_versions?.[0]?.url || null,
        followerCount,
        followingCount:    u.following_count ?? u.edge_follow?.count ?? 0,
        mediaCount:        u.media_count     ?? u.edge_owner_to_timeline_media?.count ?? 0,
        engagementRate,
        avgLikes,
        avgComments,
        biography:         u.biography       || '',
        isVerified:        u.is_verified     ?? false,
        isPrivate:         u.is_private      ?? false,
      },
      posts,
    });

  } catch (err) {
    console.error('[instagram-profile] error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
