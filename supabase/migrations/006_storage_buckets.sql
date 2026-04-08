-- Storage buckets for user-uploaded media
-- Run this in the Supabase SQL editor or via supabase db push

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('covers',  'covers',  true,  10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('logos',   'logos',   true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('content', 'content', true,  52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Public read policy for all buckets
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public read covers"  ON storage.objects;
DROP POLICY IF EXISTS "Public read logos"   ON storage.objects;
DROP POLICY IF EXISTS "Public read content" ON storage.objects;
CREATE POLICY "Public read avatars"  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read covers"   ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Public read logos"    ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Public read content"  ON storage.objects FOR SELECT USING (bucket_id = 'content');

-- Authenticated upload (own folder only)
DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload covers"  ON storage.objects;
DROP POLICY IF EXISTS "Auth upload logos"   ON storage.objects;
DROP POLICY IF EXISTS "Auth upload content" ON storage.objects;
CREATE POLICY "Auth upload avatars"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars'  AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth upload covers"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers'   AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth upload logos"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos'    AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth upload content"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'content'  AND auth.uid()::text = (storage.foldername(name))[1]);

-- Owner can update/delete
DROP POLICY IF EXISTS "Owner update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner update covers"  ON storage.objects;
DROP POLICY IF EXISTS "Owner update logos"   ON storage.objects;
DROP POLICY IF EXISTS "Owner update content" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete covers"  ON storage.objects;
DROP POLICY IF EXISTS "Owner delete logos"   ON storage.objects;
DROP POLICY IF EXISTS "Owner delete content" ON storage.objects;
CREATE POLICY "Owner update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars'  AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update covers"  ON storage.objects FOR UPDATE USING (bucket_id = 'covers'   AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update logos"   ON storage.objects FOR UPDATE USING (bucket_id = 'logos'    AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update content" ON storage.objects FOR UPDATE USING (bucket_id = 'content'  AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars'  AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete covers"  ON storage.objects FOR DELETE USING (bucket_id = 'covers'   AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete logos"   ON storage.objects FOR DELETE USING (bucket_id = 'logos'    AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete content" ON storage.objects FOR DELETE USING (bucket_id = 'content'  AND auth.uid()::text = (storage.foldername(name))[1]);
