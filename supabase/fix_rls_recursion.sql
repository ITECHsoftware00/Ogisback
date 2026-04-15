-- ═══════════════════════════════════════════════════════════════
-- Fix: infinite recursion in profiles RLS policies
-- Root cause: admin policies query profiles table inside profiles policy
-- Fix: use a SECURITY DEFINER function that bypasses RLS
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Create a helper function that reads the current user's role
-- SECURITY DEFINER = runs as DB owner, bypasses RLS, no recursion
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Step 2: Drop all the broken recursive admin policies
DROP POLICY IF EXISTS "Admin read all profiles"        ON profiles;
DROP POLICY IF EXISTS "Admin read all creators"        ON creator_profiles;
DROP POLICY IF EXISTS "Admin read all brands"          ON brand_profiles;
DROP POLICY IF EXISTS "Admin read all campaigns"       ON campaigns;
DROP POLICY IF EXISTS "Admin read all orders"          ON orders;
DROP POLICY IF EXISTS "Admin read all escrow"          ON escrow;
DROP POLICY IF EXISTS "Admin read all withdrawals"     ON withdrawals;
DROP POLICY IF EXISTS "Admin read all transactions"    ON wallet_transactions;
DROP POLICY IF EXISTS "Admin read all subscriptions"   ON subscriptions;
DROP POLICY IF EXISTS "Admin read all conversations"   ON conversations;
DROP POLICY IF EXISTS "Admin read all applications"    ON campaign_applications;
DROP POLICY IF EXISTS "Admin update profiles"          ON profiles;
DROP POLICY IF EXISTS "Admin update creators"          ON creator_profiles;
DROP POLICY IF EXISTS "Admin update withdrawals"       ON withdrawals;
DROP POLICY IF EXISTS "Admin update orders"            ON orders;

-- Step 3: Recreate all admin policies using get_my_role() — no recursion
CREATE POLICY "Admin read all profiles"        ON profiles             FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all creators"        ON creator_profiles     FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all brands"          ON brand_profiles       FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all campaigns"       ON campaigns            FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all orders"          ON orders               FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all escrow"          ON escrow               FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all withdrawals"     ON withdrawals          FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all transactions"    ON wallet_transactions  FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all subscriptions"   ON subscriptions        FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all conversations"   ON conversations        FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin read all applications"    ON campaign_applications FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Admin update profiles"          ON profiles             FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "Admin update creators"          ON creator_profiles     FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "Admin update withdrawals"       ON withdrawals          FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY "Admin update orders"            ON orders               FOR UPDATE USING (get_my_role() = 'admin');

-- Step 4: Verify — this should return your user's role without error
SELECT get_my_role();
