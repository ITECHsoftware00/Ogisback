import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_ID     = Deno.env.get('FACEBOOK_APP_ID')        || '';
const APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET')    || '';
const SUPA_URL   = Deno.env.get('SUPABASE_URL')           || '';
const SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const GRAPH      = 'https://graph.facebook.com/v19.0';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { code, redirectUri, userId } = await req.json();
    if (!code || !redirectUri) {
      return json({ error: 'Missing code or redirectUri' }, 400);
    }

    // 1. Short-lived user token
    const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id',     APP_ID);
    tokenUrl.searchParams.set('client_secret', APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri',  redirectUri);
    tokenUrl.searchParams.set('code',          code);
    const tokenRes  = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return json({ error: 'Token exchange failed', detail: tokenData }, 400);
    }
    const shortToken = tokenData.access_token;

    // 2. Long-lived user token (60-day)
    const llUrl = new URL(`${GRAPH}/oauth/access_token`);
    llUrl.searchParams.set('grant_type',        'fb_exchange_token');
    llUrl.searchParams.set('client_id',         APP_ID);
    llUrl.searchParams.set('client_secret',     APP_SECRET);
    llUrl.searchParams.set('fb_exchange_token', shortToken);
    const llRes   = await fetch(llUrl.toString());
    const llData  = await llRes.json();
    const userToken = llData.access_token || shortToken;

    // 3. Pages (need page token to call Insights)
    const pagesRes  = await fetch(`${GRAPH}/me/accounts?fields=name,fan_count,access_token&access_token=${userToken}`);
    const pagesData = await pagesRes.json();
    const pages     = pagesData?.data || [];
    // deno-lint-ignore no-explicit-any
    const topPage: any = pages.sort((a: any, b: any) => (b.fan_count || 0) - (a.fan_count || 0))[0];
    const facebookPageName  = topPage?.name      || '';
    const facebookFollowers = topPage?.fan_count || 0;

    let instagramBusinessId: string | null = null;
    let instagramPageToken:  string | null = null;
    let instagramUsername   = '';
    let instagramFollowers  = 0;

    // 4. IG Business Account linked to the top Page
    if (topPage?.id && topPage?.access_token) {
      const pageToken = topPage.access_token;
      const igLinkRes  = await fetch(`${GRAPH}/${topPage.id}?fields=instagram_business_account&access_token=${pageToken}`);
      const igLinkData = await igLinkRes.json();
      const igId       = igLinkData?.instagram_business_account?.id;
      if (igId) {
        const igRes  = await fetch(`${GRAPH}/${igId}?fields=username,followers_count&access_token=${pageToken}`);
        const igData = await igRes.json();
        instagramUsername   = igData?.username        || '';
        instagramFollowers  = igData?.followers_count || 0;
        instagramBusinessId = igId;
        instagramPageToken  = pageToken;
      }
    }

    // 5. Persist IG Business credentials so we can call Insights later without a token round-trip
    if (userId && instagramBusinessId && instagramPageToken && SUPA_URL && SERVICE) {
      const sb = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false } });
      await sb.from('creator_profiles').update({
        instagram_business_id: instagramBusinessId,
        instagram_page_token:  instagramPageToken,
      }).eq('id', userId);
    }

    return json({
      facebookPageName,
      facebookFollowers,
      instagramUsername,
      instagramFollowers,
      instagramBusinessId,
      connected: !!instagramBusinessId,
    });

  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
