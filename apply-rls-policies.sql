-- Apply RLS Policies for Family Finance PWA
-- Run this directly in Supabase SQL Editor

-- Step 1: Clean up existing policies
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;
DROP POLICY IF EXISTS "accounts_select_policy" ON accounts;
DROP POLICY IF EXISTS "accounts_insert_policy" ON accounts;
DROP POLICY IF EXISTS "accounts_update_policy" ON accounts;
DROP POLICY IF EXISTS "accounts_delete_policy" ON accounts;
DROP POLICY IF EXISTS "service_role_bypass" ON categories;
DROP POLICY IF EXISTS "service_role_bypass" ON accounts;

-- Step 2: Create or replace unified policies for categories
DROP POLICY IF EXISTS "categories_full_access" ON categories;
CREATE POLICY "categories_full_access" ON categories
FOR ALL
USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
    OR auth.role() = 'service_role'
)
WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
    OR auth.role() = 'service_role'
);

-- Step 3: Create or replace unified policies for accounts
DROP POLICY IF EXISTS "accounts_full_access" ON accounts;
CREATE POLICY "accounts_full_access" ON accounts
FOR ALL
USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
    OR auth.role() = 'service_role'
)
WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
    OR auth.role() = 'service_role'
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Step 5: Test the configuration
SELECT 
    'RLS Configuration Applied Successfully' as status,
    (SELECT count(*) FROM categories) as total_categories,
    (SELECT count(*) FROM accounts) as total_accounts,
    current_user as current_db_user;