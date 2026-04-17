import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const APP_ID     = Deno.env.get('FACEBOOK_APP_ID')     || '';
const APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET') || '';
const GRAPH      = 'https://graph.facebook.com/v19.0';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { code, redirectUri } = await req.json();
    if (!code || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Missing code or redirectUri' }), { status: 400, headers: CORS });
    }

    // 1. Exchange code for user access token
    const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id',     APP_ID);
    tokenUrl.searchParams.set('client_secret', APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri',  redirectUri);
    tokenUrl.searchParams.set('code',          code);

    const tokenRes  = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Token exchange failed', detail: tokenData }), { status: 400, headers: CORS });
    }
    const userToken = tokenData.access_token;

    // 2. Get user's Facebook Pages (fan_count = page followers)
    const pagesRes  = await fetch(`${GRAPH}/me/accounts?fields=name,fan_count,access_token&access_token=${userToken}`);
    const pagesData = await pagesRes.json();
    const pages     = pagesData?.data || [];

    // Pick the page with the most fans
    const topPage = pages.sort((a: any, b: any) => (b.fan_count || 0) - (a.fan_count || 0))[0];

    let instagramUsername  = '';
    let instagramFollowers = 0;
    let facebookPageName   = topPage?.name      || '';
    let facebookFollowers  = topPage?.fan_count || 0;

    // 3. Get Instagram Business Account linked to the top page
    if (topPage?.id && topPage?.access_token) {
      const igLinkRes  = await fetch(`${GRAPH}/${topPage.id}?fields=instagram_business_account&access_token=${topPage.access_token}`);
      const igLinkData = await igLinkRes.json();
      const igId       = igLinkData?.instagram_business_account?.id;

      if (igId) {
        const igRes  = await fetch(`${GRAPH}/${igId}?fields=username,followers_count&access_token=${topPage.access_token}`);
        const igData = await igRes.json();
        instagramUsername  = igData?.username        || '';
        instagramFollowers = igData?.followers_count || 0;
      }
    }

    return new Response(JSON.stringify({
      facebookPageName,
      facebookFollowers,
      instagramUsername,
      instagramFollowers,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS });
  }
});
