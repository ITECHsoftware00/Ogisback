-- ═══════════════════════════════════════════════════════════════
-- Saved Posts
-- Users (brand or creator) can bookmark content posts
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS saved_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  post_id    UUID REFERENCES content_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved posts"
  ON saved_posts FOR ALL USING (auth.uid() = user_id);
