-- ═══════════════════════════════════════════════════════════════
-- Migration 011: Fix trigger to derive role from OAuth provider
-- Google → brand, Instagram/Facebook → creator
-- Run AFTER 010_auth_online_status.sql
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role     TEXT;
  v_name     TEXT;
  v_provider TEXT;
  v_username TEXT;
  v_slug     TEXT;
BEGIN
  -- Determine provider: google → brand, instagram/facebook → creator
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', '');

  -- Role priority: explicit metadata role > provider-based role > fallback 'creator'
  v_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role', ''),
    CASE
      WHEN v_provider = 'google'    THEN 'brand'
      WHEN v_provider IN ('instagram', 'facebook') THEN 'creator'
      ELSE 'creator'
    END
  );

  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(COALESCE(NEW.email, 'user'), '@', 1)
  );

  -- Create the base profile row (skip if already exists — re-sign-in)
  INSERT INTO profiles (id, role, plan)
  VALUES (NEW.id, v_role, 'free')
  ON CONFLICT (id) DO NOTHING;

  -- Create the role-specific sub-profile
  IF v_role = 'creator' THEN
    v_username := regexp_replace(lower(split_part(COALESCE(NEW.email, 'user'), '@', 1)), '[^a-z0-9]', '', 'g');
    v_username := CASE WHEN length(v_username) > 0 THEN v_username ELSE 'creator' END;
    v_username := v_username || floor(random() * 9000 + 1000)::text;
    INSERT INTO creator_profiles (id, username, name)
    VALUES (NEW.id, v_username, v_name)
    ON CONFLICT (id) DO NOTHING;

  ELSIF v_role = 'brand' THEN
    v_slug := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_slug := CASE WHEN length(v_slug) > 0 THEN v_slug ELSE 'brand' END;
    v_slug := v_slug || floor(random() * 9000 + 1000)::text;
    INSERT INTO brand_profiles (id, slug, name)
    VALUES (NEW.id, v_slug, v_name)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
