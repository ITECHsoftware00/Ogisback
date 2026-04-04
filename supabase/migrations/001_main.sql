-- ═══════════════════════════════════════════════════════════════
-- OgisBack Main Schema
-- Run this FIRST in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Profiles (extends auth.users) ──────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role             TEXT NOT NULL CHECK (role IN ('creator', 'brand')),
  plan             TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'mini', 'pro', 'max')),
  profile_complete BOOLEAN DEFAULT FALSE,
  dark_mode        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Creator Profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_profiles (
  id                   UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  username             TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  bio                  TEXT,
  avatar_url           TEXT,
  cover_url            TEXT,
  location             TEXT,
  website              TEXT,
  niche                TEXT[] DEFAULT '{}',
  instagram            TEXT,
  tiktok               TEXT,
  youtube              TEXT,
  instagram_followers  INT DEFAULT 0,
  tiktok_followers     INT DEFAULT 0,
  youtube_followers    INT DEFAULT 0,
  total_followers      INT GENERATED ALWAYS AS (instagram_followers + tiktok_followers + youtube_followers) STORED,
  rate_post            NUMERIC DEFAULT 0,
  rate_reel            NUMERIC DEFAULT 0,
  rate_story           NUMERIC DEFAULT 0,
  rate_video           NUMERIC DEFAULT 0,
  wallet_balance       NUMERIC DEFAULT 0,
  pending_balance      NUMERIC DEFAULT 0,
  rating               NUMERIC DEFAULT 0,
  review_count         INT DEFAULT 0,
  completed_orders     INT DEFAULT 0,
  verified             BOOLEAN DEFAULT FALSE,
  response_time        TEXT DEFAULT '24h',
  on_time_rate         INT DEFAULT 100,
  is_online            BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Brand Profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_profiles (
  id             UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  logo_url       TEXT,
  industry       TEXT,
  website        TEXT,
  description    TEXT,
  company_size   TEXT,
  location       TEXT,
  wallet_balance NUMERIC DEFAULT 0,
  total_spent    NUMERIC DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Campaigns ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  niche           TEXT[] DEFAULT '{}',
  content_type    TEXT,
  budget_min      NUMERIC,
  budget_max      NUMERIC,
  deadline        DATE,
  min_followers   INT DEFAULT 0,
  platforms       TEXT[] DEFAULT '{}',
  deliverables    TEXT[] DEFAULT '{}',
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  applicant_count INT DEFAULT 0,
  hired_count     INT DEFAULT 0,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Campaign Applications ───────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id    UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  pitch         TEXT,
  proposed_rate NUMERIC,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

-- ── 6. Orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  creator_id       UUID REFERENCES creator_profiles(id) ON DELETE SET NULL,
  brand_id         UUID REFERENCES brand_profiles(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  amount           NUMERIC NOT NULL,
  platform_fee     NUMERIC GENERATED ALWAYS AS (amount * 0.20) STORED,
  creator_earnings NUMERIC GENERATED ALWAYS AS (amount * 0.80) STORED,
  status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_review', 'revision', 'delivered', 'completed', 'cancelled')),
  due_date         DATE,
  deliverables     TEXT[] DEFAULT '{}',
  revision_count   INT DEFAULT 0,
  max_revisions    INT DEFAULT 2,
  escrow_status    TEXT DEFAULT 'held' CHECK (escrow_status IN ('held', 'released', 'refunded')),
  delivery_note    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. Conversations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID REFERENCES creator_profiles(id) ON DELETE SET NULL,
  brand_id        UUID REFERENCES brand_profiles(id) ON DELETE SET NULL,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_creator  INT DEFAULT 0,
  unread_brand    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, brand_id)
);

-- ── 8. Messages ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_role     TEXT CHECK (sender_role IN ('creator', 'brand')),
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  read       BOOLEAN DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 10. Withdrawals ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  amount          NUMERIC NOT NULL,
  method          TEXT NOT NULL,
  account_details TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public read profiles"  ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile write"     ON profiles FOR ALL    USING (auth.uid() = id);

-- Creator profiles
CREATE POLICY "Public read creator profiles" ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Own creator profile write"    ON creator_profiles FOR ALL    USING (auth.uid() = id);

-- Brand profiles
CREATE POLICY "Public read brand profiles" ON brand_profiles FOR SELECT USING (true);
CREATE POLICY "Own brand profile write"    ON brand_profiles FOR ALL    USING (auth.uid() = id);

-- Campaigns
CREATE POLICY "Public read active campaigns" ON campaigns FOR SELECT USING (status = 'active' OR brand_id = auth.uid());
CREATE POLICY "Brand manage campaigns"       ON campaigns FOR ALL    USING (brand_id = auth.uid());

-- Campaign applications
CREATE POLICY "Creator manage own applications" ON campaign_applications FOR ALL USING (creator_id = auth.uid());
CREATE POLICY "Brand read applications"         ON campaign_applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.brand_id = auth.uid()));

-- Orders
CREATE POLICY "Order participants access" ON orders FOR ALL
  USING (creator_id = auth.uid() OR brand_id = auth.uid());

-- Conversations
CREATE POLICY "Conversation participants access" ON conversations FOR ALL
  USING (creator_id = auth.uid() OR brand_id = auth.uid());

-- Messages
CREATE POLICY "Conversation participant messages" ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.creator_id = auth.uid() OR c.brand_id = auth.uid())
    )
  );

-- Notifications
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Withdrawals
CREATE POLICY "Own withdrawals" ON withdrawals FOR ALL USING (creator_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- Auth Trigger: auto-create profile on signup
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'creator'),
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
