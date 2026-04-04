// Supabase Edge Function: create-top-up-session
// One-time wallet top-up for brands via Stripe Checkout
// Deploy: supabase functions deploy create-top-up-session

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId, userEmail, amount, currency = 'usd' } = await req.json();

    if (!userId || !userEmail || !amount || amount < 10) {
      return new Response(JSON.stringify({ error: 'userId, userEmail, and amount (min $10) are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
    }

    const amountCents = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency,
          unit_amount: amountCents,
          product_data: {
            name: 'OgisBack Wallet Top-Up',
            description: `Add $${amount.toFixed(2)} to your OgisBack brand wallet`,
            images: [`${SITE_URL}/favicon.svg`],
          },
        },
        quantity: 1,
      }],
      payment_intent_data: {
        metadata: {
          supabase_user_id: userId,
          type: 'wallet_topup',
          amount: amount.toString(),
        },
      },
      success_url: `${SITE_URL}/payment/success?type=topup&amount=${amount}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/brand/add-funds`,
      metadata: {
        supabase_user_id: userId,
        type: 'wallet_topup',
        amount: amount.toString(),
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Top-up session error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
