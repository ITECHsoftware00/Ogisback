-- ═══════════════════════════════════════════════════════════════
-- OgisBack Saved Creators
-- Run in Supabase SQL Editor AFTER 001–004
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_creators (
  brand_id    UUID REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
  creator_id  UUID REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (brand_id, creator_id)
);

ALTER TABLE saved_creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brand manages own saved" ON saved_creators;
CREATE POLICY "Brand manages own saved" ON saved_creators
  FOR ALL USING (brand_id = auth.uid());
