-- ═══════════════════════════════════════════════════════════════
-- OgisBack: Full repair script — run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Ensure is_online + last_seen exist on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- 2. Fix the handle_new_user trigger
--    - Reads role from user_metadata (set by email sign-up)
--    - Falls back to provider (google → brand, facebook/instagram → creator)
--    - Falls back to 'creator' for email/unknown
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role     TEXT;
  v_name     TEXT;
  v_provider TEXT;
  v_username TEXT;
  v_slug     TEXT;
BEGIN
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  v_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    CASE
      WHEN v_provider = 'google'                      THEN 'brand'
      WHEN v_provider IN ('facebook', 'instagram')    THEN 'creator'
      ELSE 'creator'
    END
  );

  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(COALESCE(NEW.email, 'user'), '@', 1)
  );

  INSERT INTO profiles (id, role, plan, profile_complete)
  VALUES (NEW.id, v_role, 'free', false)
  ON CONFLICT (id) DO NOTHING;

  IF v_role = 'creator' THEN
    v_username := regexp_replace(lower(split_part(COALESCE(NEW.email,'user'),'@',1)),'[^a-z0-9]','','g');
    v_username := COALESCE(NULLIF(v_username,''), 'creator');
    v_username := v_username || floor(random()*9000+1000)::text;
    INSERT INTO creator_profiles (id, username, name)
    VALUES (NEW.id, v_username, v_name)
    ON CONFLICT (id) DO NOTHING;

  ELSIF v_role = 'brand' THEN
    v_slug := regexp_replace(lower(v_name),'[^a-z0-9]+','-','g');
    v_slug := COALESCE(NULLIF(v_slug,''), 'brand');
    v_slug := v_slug || floor(random()*9000+1000)::text;
    INSERT INTO brand_profiles (id, slug, name)
    VALUES (NEW.id, v_slug, v_name)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- never block user creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Backfill: create missing profiles for users who already signed up
--    (trigger didn't run for them)
INSERT INTO profiles (id, role, plan, profile_complete)
SELECT
  au.id,
  CASE
    WHEN au.raw_app_meta_data->>'provider' = 'google'                   THEN 'brand'
    WHEN au.raw_app_meta_data->>'provider' IN ('facebook','instagram')   THEN 'creator'
    WHEN au.raw_user_meta_data->>'role' IS NOT NULL                      THEN au.raw_user_meta_data->>'role'
    ELSE 'creator'
  END,
  'free',
  false
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 4. Backfill: create missing creator_profiles
INSERT INTO creator_profiles (id, username, name)
SELECT
  p.id,
  regexp_replace(lower(split_part(COALESCE(au.email,'user'),'@',1)),'[^a-z0-9]','','g')
    || floor(random()*9000+1000)::text,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(COALESCE(au.email,'user'),'@',1)
  )
FROM profiles p
JOIN auth.users au ON au.id = p.id
LEFT JOIN creator_profiles cp ON cp.id = p.id
WHERE p.role = 'creator' AND cp.id IS NULL;

-- 5. Backfill: create missing brand_profiles
INSERT INTO brand_profiles (id, slug, name)
SELECT
  p.id,
  regexp_replace(lower(
    COALESCE(au.raw_user_meta_data->>'full_name',
             au.raw_user_meta_data->>'name',
             split_part(COALESCE(au.email,'user'),'@',1))
  ),'[^a-z0-9]+','-','g') || floor(random()*9000+1000)::text,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(COALESCE(au.email,'user'),'@',1)
  )
FROM profiles p
JOIN auth.users au ON au.id = p.id
LEFT JOIN brand_profiles bp ON bp.id = p.id
WHERE p.role = 'brand' AND bp.id IS NULL;

-- 6. Verify results
SELECT
  au.email,
  p.role,
  p.plan,
  p.profile_complete,
  CASE WHEN cp.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_creator_profile,
  CASE WHEN bp.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_brand_profile
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN creator_profiles cp ON cp.id = au.id
LEFT JOIN brand_profiles bp ON bp.id = au.id
ORDER BY au.created_at DESC;
