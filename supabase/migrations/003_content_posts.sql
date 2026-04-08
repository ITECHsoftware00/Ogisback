-- ═══════════════════════════════════════════════════════════════
-- OgisBack Content Posts
-- Run this in Supabase SQL Editor AFTER 001 and 002
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID REFERENCES creator_profiles(id) ON DELETE CASCADE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('photo','carousel','reel','video')),
  media_url     TEXT NOT NULL,
  media_urls    TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  caption       TEXT,
  tags          TEXT[] DEFAULT '{}',
  platform      TEXT,
  likes         INT DEFAULT 0,
  comments      INT DEFAULT 0,
  views         INT DEFAULT 0,
  shares        INT DEFAULT 0,
  status        TEXT DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published posts" ON content_posts;
CREATE POLICY "Public read published posts" ON content_posts
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Creator manage own posts" ON content_posts;
CREATE POLICY "Creator manage own posts" ON content_posts
  FOR ALL USING (creator_id = auth.uid());

-- Safely increment views (called from frontend without auth check)
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content_posts SET views = views + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely increment likes
CREATE OR REPLACE FUNCTION increment_post_likes(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE content_posts SET likes = likes + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
