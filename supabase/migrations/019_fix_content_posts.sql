-- Fix content_posts table:
-- 1. Make media_url nullable (text-only posts have no media)
-- 2. Add 'text' to the type check constraint
-- 3. Add location column
-- 4. Increase content bucket size limit for videos
-- Make media_url nullable
ALTER TABLE content_posts
ALTER COLUMN media_url DROP NOT NULL;
-- Fix type check to include 'text'
ALTER TABLE content_posts DROP CONSTRAINT IF EXISTS content_posts_type_check;
ALTER TABLE content_posts
ADD CONSTRAINT content_posts_type_check CHECK (
    type IN ('text', 'photo', 'carousel', 'reel', 'video')
  );
-- Add location if missing
ALTER TABLE content_posts
ADD COLUMN IF NOT EXISTS location TEXT;
-- Increase content bucket file size limit to 200 MB for videos
UPDATE storage.buckets
SET file_size_limit = 209715200
WHERE id = 'content';
-- Ensure webm is also allowed (common browser recording format)
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'video/webm')
WHERE id = 'content'
  AND NOT ('video/webm' = ANY(allowed_mime_types));