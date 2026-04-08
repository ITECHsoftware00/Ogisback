-- ═══════════════════════════════════════════════════════════════
-- OgisBack Social Analytics Fields
-- Run AFTER 007_admin_role.sql
-- ═══════════════════════════════════════════════════════════════

-- Add per-platform engagement rates and audience location to creator profiles
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS instagram_engagement NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_engagement    NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_engagement   NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_avg_likes  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_avg_comments INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_avg_likes     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_avg_comments  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_avg_likes    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_avg_comments INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS audience_locations   JSONB DEFAULT '[]';

-- audience_locations format:
-- [{ "country": "United States", "percent": 45 }, { "country": "UK", "percent": 20 }, ...]
