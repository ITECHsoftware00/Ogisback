/**
 * payments.js — Frontend payment utilities
 * Handles Stripe Checkout, subscriptions, escrow, and wallet transactions.
 */
import { supabase } from '../supabaseClient';

// ── Stripe Price IDs ────────────────────────────────────────────
// These must match the price_id values in the stripe_prices table.
// After creating products in Stripe Dashboard, update these IDs.
export const STRIPE_PRICES = {
  creator: {
    mini: { monthly: 'price_creator_mini_monthly', annual: 'price_creator_mini_annual' },
    max:  { monthly: 'price_creator_max_monthly',  annual: 'price_creator_max_annual'  },
  },
  brand: {
    mini: { monthly: 'price_brand_mini_monthly', annual: 'price_brand_mini_annual' },
    max:  { monthly: 'price_brand_max_monthly',  annual: 'price_brand_max_annual'  },
  },
};

// ── Subscription Checkout ───────────────────────────────────────

/**
 * Starts a Stripe Checkout session for a subscription plan.
 * Redirects the browser to Stripe's hosted checkout page.
 */
export async function startSubscriptionCheckout({ userId, userEmail, role, planId, billingCycle }) {
  if (planId === 'free') throw new Error('Cannot checkout for free plan');

  // Try DB price first, fall back to hardcoded map
  let priceId = await getPriceId(role, planId, billingCycle);
  if (!priceId) priceId = STRIPE_PRICES[role]?.[planId]?.[billingCycle];
  if (!priceId) throw new Error(`Unknown plan: ${role} ${planId} ${billingCycle}`);

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, userId, userEmail, planId, billingCycle, role },
  });

  // Surface the real Stripe/server error from the response body
  const msg = data?.error || error?.message || 'Checkout session creation failed';
  if (error || data?.error) throw new Error(msg);
  if (!data?.url) throw new Error('No checkout URL returned');

  window.location.href = data.url;
}

/**
 * Opens the Stripe Customer Portal to manage/cancel subscription.
 */
export async function openCustomerPortal(userId) {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: { userId },
  });
  const msg = data?.error || error?.message || 'Failed to open portal';
  if (error || data?.error) throw new Error(msg);
  if (data?.url) window.location.href = data.url;
}

// ── Subscription Data ───────────────────────────────────────────

export async function getSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data ?? null;
}

export async function cancelSubscription(userId) {
  // Marks cancel_at_period_end = true — user keeps plan until period ends
  const sub = await getSubscription(userId);
  if (!sub?.stripe_subscription_id) throw new Error('No active subscription found');

  const { error } = await supabase.functions.invoke('cancel-subscription', {
    body: { subscriptionId: sub.stripe_subscription_id, userId },
  });
  if (error) throw new Error(error.message);
}

// ── Wallet Transactions ─────────────────────────────────────────

export async function getWalletTransactions(userId, limit = 30) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function logWalletTransaction({ userId, type, amount, description, orderId, withdrawalId, subscriptionId }) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      user_id: userId,
      type,
      amount,
      description,
      order_id: orderId ?? null,
      withdrawal_id: withdrawalId ?? null,
      subscription_id: subscriptionId ?? null,
      status: 'completed',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Escrow ──────────────────────────────────────────────────────

export async function getEscrow(orderId) {
  const { data, error } = await supabase
    .from('escrow')
    .select('*')
    .eq('order_id', orderId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function createEscrow({ orderId, brandId, creatorId, amount, feeRate = 0.20 }) {
  const platformFee = amount * feeRate;
  const creatorPayout = amount - platformFee;

  const { data, error } = await supabase
    .from('escrow')
    .insert({
      order_id: orderId,
      brand_id: brandId,
      creator_id: creatorId,
      amount,
      platform_fee: platformFee,
      creator_payout: creatorPayout,
      fee_rate: feeRate,
      status: 'held',
    })
    .select()
    .single();
  if (error) throw error;

  // Log brand debit
  await logWalletTransaction({
    userId: brandId,
    type: 'order_payment',
    amount: -amount,
    description: 'Order payment held in escrow',
    orderId,
  });

  // Log creator pending credit
  await logWalletTransaction({
    userId: creatorId,
    type: 'escrow_credit',
    amount,
    description: 'Payment held in escrow — pending your delivery',
    orderId,
  });

  // Update creator pending_balance
  await supabase
    .from('creator_profiles')
    .update({ pending_balance: supabase.raw('pending_balance + ' + amount) })
    .eq('id', creatorId);

  return data;
}

export async function releaseEscrow(orderId) {
  // Calls the SQL function which handles balance updates atomically
  const { error } = await supabase.rpc('release_escrow', { p_order_id: orderId });
  if (error) throw error;
}

export async function refundEscrow(orderId) {
  const { error } = await supabase.rpc('refund_escrow', { p_order_id: orderId });
  if (error) throw error;
}

// ── Withdrawals ─────────────────────────────────────────────────

export async function submitWithdrawal({ creatorId, amount, method, accountDetails, walletBalance }) {
  if (amount < 10) throw new Error('Minimum withdrawal is $10');
  if (amount > walletBalance) throw new Error('Insufficient wallet balance');

  // Create withdrawal record
  const { data: withdrawal, error } = await supabase
    .from('withdrawals')
    .insert({
      creator_id: creatorId,
      amount,
      method,
      account_details: accountDetails,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;

  // Deduct from wallet immediately (optimistic — admin can refund if needed)
  await supabase
    .from('creator_profiles')
    .update({ wallet_balance: supabase.raw(`wallet_balance - ${amount}`) })
    .eq('id', creatorId);

  // Log wallet transaction
  await logWalletTransaction({
    userId: creatorId,
    type: 'withdrawal',
    amount: -amount,
    description: `Withdrawal via ${method}`,
    withdrawalId: withdrawal.id,
  });

  return withdrawal;
}

export async function getWithdrawalHistory(creatorId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Wallet Top-Up (Brand) ───────────────────────────────────────

/**
 * Starts a Stripe Checkout session for a one-time wallet top-up.
 * Redirects to Stripe hosted checkout.
 */
export async function startWalletTopUp({ userId, userEmail, amount }) {
  if (!amount || amount < 10) throw new Error('Minimum top-up is $10');

  const { data, error } = await supabase.functions.invoke('create-top-up-session', {
    body: { userId, userEmail, amount: parseFloat(amount) },
  });

  const msg = data?.error || error?.message || 'Failed to create top-up session';
  if (error || data?.error) throw new Error(msg);
  if (!data?.url) throw new Error('No checkout URL returned');

  window.location.href = data.url;
}

// ── Brand Payments ──────────────────────────────────────────────

export async function getBrandPaymentSummary(brandId) {
  const [{ data: orders, error }, { data: profile }] = await Promise.all([
    supabase.from('orders').select('amount, escrow_status, created_at').eq('brand_id', brandId),
    supabase.from('brand_profiles').select('wallet_balance').eq('id', brandId).single(),
  ]);
  if (error) throw error;

  const safeOrders = orders ?? [];
  const total = safeOrders.filter(o => o.escrow_status === 'released').reduce((s, o) => s + o.amount, 0);
  const inEscrow = safeOrders.filter(o => o.escrow_status === 'held').reduce((s, o) => s + o.amount, 0);

  return { total, inEscrow, orderCount: safeOrders.length, walletBalance: profile?.wallet_balance ?? 0 };
}

// ── Stripe Price lookup ─────────────────────────────────────────

export async function getStripePrices() {
  const { data, error } = await supabase.from('stripe_prices').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function getPriceId(role, plan, billing) {
  const { data } = await supabase
    .from('stripe_prices')
    .select('price_id')
    .eq('role', role)
    .eq('plan', plan)
    .eq('billing', billing)
    .single();
  return data?.price_id ?? null;
}

// ── Fee rate helper ─────────────────────────────────────────────
export function getFeeRate(plan) {
  const rates = { free: 0.20, mini_creator: 0.18, mini_brand: 0.15, max_creator: 0.15, max_brand: 0.10 };
  return rates[plan] ?? 0.20;
}

export function getCreatorFeeRate(plan) {
  return { free: 0.20, mini: 0.18, max: 0.15 }[plan] ?? 0.20;
}

export function getBrandFeeRate(plan) {
  return { free: 0.20, mini: 0.15, max: 0.10 }[plan] ?? 0.20;
}
