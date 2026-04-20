import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Placeholder — TikTok stats are now computed client-side from Ogisback post data.
// This function is kept for backwards compatibility.
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  return new Response(JSON.stringify({ error: 'Use tiktok-followers endpoint instead' }), {
    status: 410,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
