-- ═══════════════════════════════════════════════════════════════
-- Post Likes & Comments
-- ═══════════════════════════════════════════════════════════════

-- ── post_likes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES content_posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes"      ON post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own likes"  ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- ── post_comments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES content_posts(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID NOT NULL,
  user_role     TEXT NOT NULL CHECK (user_role IN ('creator', 'brand')),
  author_name   TEXT NOT NULL,
  author_avatar TEXT,
  body          TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments"        ON post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"   ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- ── Toggle like (atomic) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  already BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM post_likes WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO already;

  IF already THEN
    DELETE FROM post_likes WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE content_posts SET likes = GREATEST(0, likes - 1) WHERE id = p_post_id;
    RETURN FALSE;  -- now unliked
  ELSE
    INSERT INTO post_likes (post_id, user_id) VALUES (p_post_id, p_user_id);
    UPDATE content_posts SET likes = likes + 1 WHERE id = p_post_id;
    RETURN TRUE;   -- now liked
  END IF;
END;
$$;

-- ── Keep content_posts.comments in sync ──────────────────────
CREATE OR REPLACE FUNCTION sync_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_posts SET comments = comments + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_posts SET comments = GREATEST(0, comments - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_count ON post_comments;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION sync_comment_count();
