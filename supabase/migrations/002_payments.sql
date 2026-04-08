-- ═══════════════════════════════════════════════════════════════
-- OgisBack Payment System Migration
-- Run this in Supabase SQL Editor AFTER the main schema (001)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'mini', 'max')),
  billing_cycle          TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status                 TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  stripe_price_id        TEXT,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT FALSE,
  trial_end              TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Wallet Transactions ────────────────────────────────────
-- Every money movement for a user (credit, debit, escrow, withdrawal)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'order_payment',    -- brand pays for order (debit)
                    'escrow_credit',    -- creator gets paid into escrow
                    'escrow_release',   -- escrow released to creator wallet
                    'escrow_refund',    -- refund back to brand
                    'withdrawal',       -- creator withdraws to external
                    'subscription',     -- subscription payment (debit)
                    'platform_fee',     -- platform fee deduction
                    'refund',           -- general refund
                    'topup'             -- brand tops up wallet
                  )),
  amount          NUMERIC(12,2) NOT NULL,      -- positive = credit, negative = debit
  balance_after   NUMERIC(12,2),               -- snapshot of balance after tx
  description     TEXT NOT NULL,
  order_id        UUID REFERENCES orders(id),
  withdrawal_id   UUID REFERENCES withdrawals(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_payment_intent_id TEXT,
  status          TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Escrow Ledger ──────────────────────────────────────────
-- Tracks escrow lifecycle per order
CREATE TABLE IF NOT EXISTS escrow (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  brand_id        UUID REFERENCES brand_profiles(id) NOT NULL,
  creator_id      UUID REFERENCES creator_profiles(id) NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,        -- full order amount
  platform_fee    NUMERIC(12,2) NOT NULL,        -- amount * fee_rate
  creator_payout  NUMERIC(12,2) NOT NULL,        -- amount - platform_fee
  fee_rate        NUMERIC(5,4) NOT NULL DEFAULT 0.20,
  status          TEXT NOT NULL DEFAULT 'held' CHECK (status IN (
                    'held',       -- funds locked in escrow
                    'released',   -- released to creator
                    'refunded',   -- refunded to brand
                    'disputed'    -- under dispute
                  )),
  stripe_payment_intent_id TEXT,
  held_at         TIMESTAMPTZ DEFAULT NOW(),
  released_at     TIMESTAMPTZ,
  refunded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Payment Methods (saved cards) ─────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  type                    TEXT NOT NULL,         -- 'card', 'paypal', etc.
  brand                   TEXT,                  -- 'visa', 'mastercard'
  last4                   TEXT,
  exp_month               INT,
  exp_year                INT,
  is_default              BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Subscription price IDs lookup ─────────────────────────
-- Maps our plan names to Stripe Price IDs (fill in after Stripe setup)
CREATE TABLE IF NOT EXISTS stripe_prices (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role       TEXT NOT NULL CHECK (role IN ('creator', 'brand')),
  plan       TEXT NOT NULL CHECK (plan IN ('mini', 'max')),
  billing    TEXT NOT NULL CHECK (billing IN ('monthly', 'annual')),
  price_id   TEXT NOT NULL,  -- Stripe price ID: price_xxx
  amount     NUMERIC(10,2) NOT NULL,
  currency   TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, plan, billing)
);

-- Insert default price mappings (update price_id after Stripe setup)
INSERT INTO stripe_prices (role, plan, billing, price_id, amount) VALUES
  ('creator', 'mini', 'monthly', 'price_creator_mini_monthly', 9.99),
  ('creator', 'mini', 'annual',  'price_creator_mini_annual',  95.88),
  ('creator', 'max',  'monthly', 'price_creator_max_monthly',  29.99),
  ('creator', 'max',  'annual',  'price_creator_max_annual',   287.88),
  ('brand',   'mini', 'monthly', 'price_brand_mini_monthly',   49.00),
  ('brand',   'mini', 'annual',  'price_brand_mini_annual',    468.00),
  ('brand',   'max',  'monthly', 'price_brand_max_monthly',    149.00),
  ('brand',   'max',  'annual',  'price_brand_max_annual',     1428.00)
ON CONFLICT (role, plan, billing) DO NOTHING;

-- ── RLS Policies ──────────────────────────────────────────────
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods      ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices        ENABLE ROW LEVEL SECURITY;

-- Subscriptions: own only
DROP POLICY IF EXISTS "Own subscriptions" ON subscriptions;
CREATE POLICY "Own subscriptions" ON subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Wallet transactions: own only
DROP POLICY IF EXISTS "Own wallet transactions" ON wallet_transactions;
CREATE POLICY "Own wallet transactions" ON wallet_transactions
  FOR ALL USING (user_id = auth.uid());

-- Escrow: brand or creator on the order
DROP POLICY IF EXISTS "Escrow participants" ON escrow;
CREATE POLICY "Escrow participants" ON escrow
  FOR ALL USING (brand_id = auth.uid() OR creator_id = auth.uid());

-- Payment methods: own only
DROP POLICY IF EXISTS "Own payment methods" ON payment_methods;
CREATE POLICY "Own payment methods" ON payment_methods
  FOR ALL USING (user_id = auth.uid());

-- Stripe prices: public read
DROP POLICY IF EXISTS "Public read stripe prices" ON stripe_prices;
CREATE POLICY "Public read stripe prices" ON stripe_prices
  FOR SELECT USING (true);

-- ── Helper Functions ──────────────────────────────────────────

-- Auto-update subscription updated_at
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_updated_at ON subscriptions;
CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscription_timestamp();

-- Update profile plan when subscription changes
CREATE OR REPLACE FUNCTION sync_subscription_plan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles SET plan = NEW.plan WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('cancelled', 'past_due') THEN
    UPDATE profiles SET plan = 'free' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_subscription_plan();

-- Release escrow: credit creator wallet, record transactions
CREATE OR REPLACE FUNCTION release_escrow(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_escrow escrow%ROWTYPE;
  v_fee_rate NUMERIC;
BEGIN
  SELECT * INTO v_escrow FROM escrow WHERE order_id = p_order_id AND status = 'held';
  IF NOT FOUND THEN RAISE EXCEPTION 'No held escrow for order %', p_order_id; END IF;

  -- Mark escrow released
  UPDATE escrow SET status = 'released', released_at = NOW() WHERE order_id = p_order_id;

  -- Credit creator wallet
  UPDATE creator_profiles
    SET wallet_balance = wallet_balance + v_escrow.creator_payout,
        pending_balance = GREATEST(0, pending_balance - v_escrow.amount)
  WHERE id = v_escrow.creator_id;

  -- Log creator wallet transaction
  INSERT INTO wallet_transactions (user_id, type, amount, description, order_id, status)
    VALUES (v_escrow.creator_id, 'escrow_release', v_escrow.creator_payout,
            'Payment released from escrow', p_order_id, 'completed');

  -- Update order escrow_status
  UPDATE orders SET escrow_status = 'released', status = 'completed' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund escrow back to brand
CREATE OR REPLACE FUNCTION refund_escrow(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_escrow escrow%ROWTYPE;
BEGIN
  SELECT * INTO v_escrow FROM escrow WHERE order_id = p_order_id AND status = 'held';
  IF NOT FOUND THEN RAISE EXCEPTION 'No held escrow for order %', p_order_id; END IF;

  UPDATE escrow SET status = 'refunded', refunded_at = NOW() WHERE order_id = p_order_id;

  -- Credit brand wallet
  UPDATE brand_profiles SET wallet_balance = wallet_balance + v_escrow.amount WHERE id = v_escrow.brand_id;

  -- Log brand wallet transaction
  INSERT INTO wallet_transactions (user_id, type, amount, description, order_id, status)
    VALUES (v_escrow.brand_id, 'escrow_refund', v_escrow.amount,
            'Escrow refunded to your wallet', p_order_id, 'completed');

  UPDATE orders SET escrow_status = 'refunded', status = 'cancelled' WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top up brand wallet
CREATE OR REPLACE FUNCTION topup_brand_wallet(p_brand_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE brand_profiles
    SET wallet_balance = wallet_balance + p_amount
  WHERE id = p_brand_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment applicant count safely
CREATE OR REPLACE FUNCTION increment_applicant_count(campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns SET applicant_count = applicant_count + 1 WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
