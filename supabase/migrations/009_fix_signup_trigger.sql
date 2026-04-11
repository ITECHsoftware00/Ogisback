-- ═══════════════════════════════════════════════════════════════
-- Fix: handle_new_user trigger now creates sub-profiles too
-- This bypasses RLS (SECURITY DEFINER) so email-signup users
-- get their creator_profiles / brand_profiles row immediately,
-- even before confirming their email.
-- Run AFTER 008_social_analytics.sql
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role     TEXT;
  v_name     TEXT;
  v_username TEXT;
  v_slug     TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'creator');
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Always create the base profile row
  INSERT INTO profiles (id, role, plan)
  VALUES (NEW.id, v_role, 'free')
  ON CONFLICT (id) DO NOTHING;

  -- Create the role-specific sub-profile
  IF v_role = 'creator' THEN
    v_username := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9]', '', 'g');
    -- Ensure uniqueness with a longer random suffix
    v_username := v_username || floor(random() * 9000 + 1000)::text;
    INSERT INTO creator_profiles (id, username, name)
    VALUES (NEW.id, v_username, v_name)
    ON CONFLICT (id) DO NOTHING;

  ELSIF v_role = 'brand' THEN
    v_slug := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_slug := v_slug || floor(random() * 9000 + 1000)::text;
    INSERT INTO brand_profiles (id, slug, name)
    VALUES (NEW.id, v_slug, v_name)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger (replace if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
