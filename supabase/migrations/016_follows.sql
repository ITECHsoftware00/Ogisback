-- ═══════════════════════════════════════════════════════════════
-- Follows System
-- Any user (brand or creator) can follow a creator
-- ═══════════════════════════════════════════════════════════════

-- Add follower_count to creator_profiles (safe - ignored if exists)
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS follower_count INT DEFAULT 0;

-- ── follows ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,                                        -- any authenticated user
  creator_id  UUID REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, creator_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read follows"       ON follows FOR SELECT USING (true);
CREATE POLICY "Auth users can follow"         ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow own follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ── Sync follower_count on creator_profiles ───────────────────
CREATE OR REPLACE FUNCTION sync_follower_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creator_profiles SET follower_count = follower_count + 1 WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creator_profiles SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.creator_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follower_count ON follows;
CREATE TRIGGER trg_follower_count
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION sync_follower_count();
