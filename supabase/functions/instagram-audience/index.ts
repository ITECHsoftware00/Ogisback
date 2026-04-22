import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GRAPH = 'https://graph.facebook.com/v19.0';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json().catch(() => ({}));
    const { ig_user_id, page_token } = body as { ig_user_id?: string; page_token?: string };

    if (!ig_user_id || !page_token) {
      return json({ error: 'Provide ig_user_id and page_token' }, 400);
    }

    // Instagram Graph API — audience_city insight (lifetime period)
    const url = `${GRAPH}/${encodeURIComponent(ig_user_id)}/insights`
      + `?metric=audience_city&period=lifetime&access_token=${encodeURIComponent(page_token)}`;

    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data?.error?.message || `Graph API HTTP ${res.status}`;
      console.error('[instagram-audience] API error:', JSON.stringify(data).slice(0, 400));
      return json({ error: msg, code: data?.error?.code }, 400);
    }

    // audience_city returns an object: { "Lagos, NG": 28.5, "London, GB": 15.2, ... }
    // deno-lint-ignore no-explicit-any
    const raw: Record<string, number> = (data?.data?.[0]?.values as any)?.[0]?.value ?? {};

    const cities = Object.entries(raw)
      .map(([city, percent]) => ({ city, percent: Math.round(Number(percent) * 10) / 10 }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 10);

    return json({ cities });

  } catch (err) {
    console.error('[instagram-audience] error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
