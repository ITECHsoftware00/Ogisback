// Supabase Edge Function: stripe-webhook
// Deploy: supabase functions deploy stripe-webhook
//
// Required secrets:
//   STRIPE_SECRET_KEY=sk_live_xxx
//   STRIPE_WEBHOOK_SECRET=whsec_xxx   ← from Stripe Dashboard → Webhooks
//   SUPABASE_URL=https://xxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJxxx  ← Service role key (not anon)
//
// Register webhook endpoint in Stripe Dashboard:
//   URL: https://xxx.supabase.co/functions/v1/stripe-webhook
//   Events: customer.subscription.created, customer.subscription.updated,
//            customer.subscription.deleted, payment_intent.succeeded,
//            checkout.session.completed

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        const billingCycle = session.metadata?.billing_cycle;
        const stripeSubId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId || !plan) break;

        const sub = await stripe.subscriptions.retrieve(stripeSubId);

        // Upsert subscription record
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan,
          billing_cycle: billingCycle ?? 'monthly',
          status: 'active',
          stripe_subscription_id: stripeSubId,
          stripe_customer_id: customerId,
          stripe_price_id: sub.items.data[0]?.price.id,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'user_id' });

        // Update profile plan (trigger also does this, belt-and-suspenders)
        await supabase.from('profiles').update({ plan }).eq('id', userId);

        console.log(`Subscription activated: user=${userId} plan=${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        const plan = sub.metadata?.plan ?? 'free';

        if (!userId) break;

        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'past_due'
          : sub.status === 'trialing' ? 'trialing'
          : 'cancelled';

        await supabase.from('subscriptions')
          .update({
            plan,
            status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        if (status === 'cancelled' || status === 'past_due') {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id);

        await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId);
        console.log(`Subscription cancelled: user=${userId}`);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = pi.metadata?.supabase_user_id;
        const txType = pi.metadata?.type;

        if (!userId) break;

        // ── Wallet top-up ──────────────────────────────────────
        if (txType === 'wallet_topup') {
          const amount = pi.amount / 100;

          // Credit brand wallet
          await supabase.rpc('topup_brand_wallet', {
            p_brand_id: userId,
            p_amount: amount,
          });

          // Log transaction
          await supabase.from('wallet_transactions').insert({
            user_id: userId,
            type: 'topup',
            amount,
            description: `Wallet top-up via Stripe`,
            stripe_payment_intent_id: pi.id,
            status: 'completed',
          });

          console.log(`Wallet top-up: user=${userId} amount=${amount}`);
          break;
        }

        // ── Order escrow payment ───────────────────────────────
        const orderId = pi.metadata?.order_id;
        if (!orderId) break;

        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          type: 'order_payment',
          amount: -(pi.amount / 100),
          description: `Order payment — ${pi.metadata?.order_title ?? orderId}`,
          order_id: orderId,
          stripe_payment_intent_id: pi.id,
          status: 'completed',
        });

        const feeRate = parseFloat(pi.metadata?.fee_rate ?? '0.20');
        const amount = pi.amount / 100;
        await supabase.from('escrow').upsert({
          order_id: orderId,
          brand_id: pi.metadata?.brand_id,
          creator_id: pi.metadata?.creator_id,
          amount,
          platform_fee: amount * feeRate,
          creator_payout: amount * (1 - feeRate),
          fee_rate: feeRate,
          status: 'held',
          stripe_payment_intent_id: pi.id,
        }, { onConflict: 'order_id' });

        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
