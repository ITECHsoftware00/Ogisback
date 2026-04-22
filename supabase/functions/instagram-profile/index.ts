import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// Instagram's internal web API — used by instagram.com itself, no key required
const IG_HEADERS = {
  'x-ig-app-id':    '936619743392459',
  'User-Agent':     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':         '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer':        'https://www.instagram.com/',
  'Origin':         'https://www.instagram.com',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
};

// deno-lint-ignore no-explicit-any
async function igFetch(url: string): Promise<any> {
  const res = await fetch(url, { headers: IG_HEADERS });
  if (!res.ok) throw new Error(`Instagram HTTP ${res.status} for ${url}`);
  return res.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const { handle } = body as { handle?: string };
    if (!handle) return json({ error: 'Provide handle' }, 400);

    const username = handle.replace(/^@/, '');

    // Fetch profile and posts in parallel
    const [profileRaw, postsRaw] = await Promise.all([
      igFetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`),
      igFetch(`https://www.instagram.com/api/v1/feed/user/${encodeURIComponent(username)}/username/?count=12`).catch(() => null),
    ]);

    // deno-lint-ignore no-explicit-any
    const u: any = profileRaw?.data?.user;
    if (!u?.username) {
      console.error('[instagram-profile] unexpected profile shape:', JSON.stringify(profileRaw).slice(0, 300));
      return json({ error: `Instagram profile @${username} not found` }, 404);
    }

    // Posts from feed endpoint — items array
    // deno-lint-ignore no-explicit-any
    const rawItems: any[] = postsRaw?.items ?? [];

    // deno-lint-ignore no-explicit-any
    const posts = rawItems.slice(0, 12).map((item: any) => {
      const isVideo    = item.media_type === 2;
      const isCarousel = item.media_type === 8;
      const thumbnailUrl =
        item.thumbnail_url ||
        item.image_versions2?.candidates?.[0]?.url ||
        item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url ||
        null;
      return {
        id:        String(item.pk ?? item.id ?? ''),
        shortcode: item.code ?? item.shortcode ?? '',
        mediaType: isVideo ? 'video' : (isCarousel ? 'carousel' : 'image'),
        thumbnailUrl,
        caption:   item.caption?.text ?? '',
        likes:     item.like_count    ?? 0,
        comments:  item.comment_count ?? 0,
        views:     item.play_count    ?? item.view_count ?? 0,
        postedAt:  item.taken_at
          ? new Date(item.taken_at * 1000).toISOString()
          : new Date().toISOString(),
      };
    });

    // Fallback: use GraphQL media count for posts if feed unavailable
    const followerCount  = u.edge_followed_by?.count  ?? u.follower_count  ?? 0;
    const followingCount = u.edge_follow?.count        ?? u.following_count ?? 0;
    const mediaCount     = u.edge_owner_to_timeline_media?.count ?? u.media_count ?? 0;

    let engagementRate = 0;
    if (posts.length > 0 && followerCount > 0) {
      // deno-lint-ignore no-explicit-any
      const sumLikes    = posts.reduce((s: number, p: any) => s + p.likes,    0);
      // deno-lint-ignore no-explicit-any
      const sumComments = posts.reduce((s: number, p: any) => s + p.comments, 0);
      engagementRate = parseFloat((((sumLikes + sumComments) / posts.length) / followerCount * 100).toFixed(2));
    }

    // deno-lint-ignore no-explicit-any
    const avgLikes    = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + p.likes,    0) / posts.length) : 0;
    // deno-lint-ignore no-explicit-any
    const avgComments = posts.length ? Math.round(posts.reduce((s: number, p: any) => s + p.comments, 0) / posts.length) : 0;

    return json({
      profile: {
        username:          u.username         ?? username,
        displayName:       u.full_name        ?? '',
        profilePictureUrl: u.profile_pic_url  ?? u.hd_profile_pic_url_info?.url ?? null,
        followerCount,
        followingCount,
        mediaCount,
        engagementRate,
        avgLikes,
        avgComments,
        biography:         u.biography        ?? '',
        isVerified:        u.is_verified      ?? false,
        isPrivate:         u.is_private       ?? false,
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
