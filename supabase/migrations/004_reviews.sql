-- ═══════════════════════════════════════════════════════════════
-- OgisBack Order Reviews
-- Run this in Supabase SQL Editor AFTER 001, 002, and 003
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS order_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  creator_id  UUID REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  brand_id    UUID REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public profiles)
DROP POLICY IF EXISTS "Public read reviews" ON order_reviews;
CREATE POLICY "Public read reviews" ON order_reviews
  FOR SELECT USING (true);

-- Only the brand that placed the order can write a review
DROP POLICY IF EXISTS "Brand can create review" ON order_reviews;
CREATE POLICY "Brand can create review" ON order_reviews
  FOR INSERT WITH CHECK (brand_id = auth.uid());

-- Brand can update their own review
DROP POLICY IF EXISTS "Brand can update review" ON order_reviews;
CREATE POLICY "Brand can update review" ON order_reviews
  FOR UPDATE USING (brand_id = auth.uid());

-- ── Refresh creator avg rating ──────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_creator_rating(p_creator_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_avg   NUMERIC;
  v_count INT;
BEGIN
  SELECT AVG(rating)::NUMERIC(3,2), COUNT(*)
    INTO v_avg, v_count
    FROM order_reviews
   WHERE creator_id = p_creator_id;

  UPDATE creator_profiles
     SET rating       = COALESCE(v_avg, 0),
         review_count = v_count
   WHERE id = p_creator_id;
END;
$$;
