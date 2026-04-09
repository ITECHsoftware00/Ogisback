// Supabase Edge Function: create-top-up-session
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

const corsHeaders = {
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { amount, currency = 'usd' } = await req.json();

    if (!amount || amount < 10) {
      return new Response(JSON.stringify({ error: 'Minimum top-up is $10' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const userEmail = user.email!;

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
          },
        },
        quantity: 1,
      }],
      payment_intent_data: {
        metadata: { supabase_user_id: userId, type: 'wallet_topup', amount: amount.toString() },
      },
      success_url: `${SITE_URL}/payment/success?type=topup&amount=${amount}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/brand/add-funds`,
      metadata: { supabase_user_id: userId, type: 'wallet_topup', amount: amount.toString() },
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
