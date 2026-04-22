import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RAPIDAPI_KEY  = Deno.env.get('RAPIDAPI_KEY') || '';
const RAPIDAPI_HOST = 'instagram-scraper-stable-api.p.rapidapi.com';
const BASE          = `https://${RAPIDAPI_HOST}`;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const RAPID_HEADERS = {
  'x-rapidapi-key':  RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
};

// POST with form-encoded body (what this API actually requires)
// deno-lint-ignore no-explicit-any
async function igPost(path: string, fields: Record<string, string>): Promise<any> {
  const body = new URLSearchParams(fields).toString();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...RAPID_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`RapidAPI HTTP ${res.status} on ${path}`);
  return res.json();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!RAPIDAPI_KEY) return json({ error: 'RAPIDAPI_KEY not configured' }, 500);

    const reqBody = await req.json().catch(() => ({}));
    const { handle } = reqBody as { handle?: string };
    if (!handle) return json({ error: 'Provide handle' }, 400);

    const username = handle.replace(/^@/, '');

    // Fetch profile + reels in parallel
    const [profileRaw, reelsRaw] = await Promise.all([
      igPost('/ig_get_fb_profile_v3.php', { username_or_url: username }),
      igPost('/get_ig_user_reels.php',    { username_or_url: username }).catch(() => null),
    ]);

    if (profileRaw?.error) {
      console.error('[instagram-profile] profile error:', profileRaw.error);
      return json({ error: profileRaw.error }, 502);
    }

    // Profile is a flat object at root level
    // deno-lint-ignore no-explicit-any
    const u: any = profileRaw;
    if (!u?.username) {
      console.error('[instagram-profile] unexpected profile shape:', JSON.stringify(profileRaw).slice(0, 300));
      return json({ error: 'Could not read Instagram profile data' }, 502);
    }

    // Reels: reels[i].node.media
    // deno-lint-ignore no-explicit-any
    const reelItems: any[] = reelsRaw?.reels ?? [];

    // deno-lint-ignore no-explicit-any
    const posts = reelItems.slice(0, 12).map((item: any) => {
      const m = item?.node?.media ?? {};
      const thumbnailUrl =
        m.thumbnail_url ||
        m.image_versions2?.candidates?.[0]?.url ||
        null;
      return {
        id:          String(m.pk ?? m.id ?? ''),
        shortcode:   m.code ?? '',
        mediaType:   'video',  // reels are always video
        thumbnailUrl,
        caption:     m.caption?.text ?? '',
        likes:       m.like_count    ?? 0,
        comments:    m.comment_count ?? 0,
        views:       m.play_count    ?? m.view_count ?? 0,
        postedAt:    m.taken_at
          ? new Date(m.taken_at * 1000).toISOString()
          : new Date().toISOString(),
      };
    });

    const followerCount = u.follower_count ?? 0;

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
        followingCount:    u.following_count  ?? 0,
        mediaCount:        u.media_count      ?? 0,
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
