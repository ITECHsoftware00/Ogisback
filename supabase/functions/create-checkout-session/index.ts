// Supabase Edge Function: create-checkout-session
// Deploy: supabase functions deploy create-checkout-session
//
// Required secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY=sk_live_xxx
//   SITE_URL=https://ogisback.com

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, userId, userEmail, planId, billingCycle, role, successUrl, cancelUrl } = await req.json();

    if (!priceId || !userId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId, role },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: cancelUrl ?? `${SITE_URL}/payment/cancel`,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          plan: planId,
          billing_cycle: billingCycle,
          role,
        },
        trial_period_days: 7, // 7-day free trial on first subscription
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        supabase_user_id: userId,
        plan: planId,
        billing_cycle: billingCycle,
        role,
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
