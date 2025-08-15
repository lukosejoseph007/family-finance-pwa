-- Fix all CRUD operations: categories, accounts, budgets, income
-- This addresses deletion, archiving, and income budget creation

-- Step 1: Ensure all tables have proper RLS policies
-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Enable read access for family members" ON categories;
DROP POLICY IF EXISTS "Enable full access for family members" ON categories;
DROP POLICY IF EXISTS "Users can view family categories" ON categories;
DROP POLICY IF EXISTS "Users can manage family categories" ON categories;

DROP POLICY IF EXISTS "Enable read access for family members" ON accounts;
DROP POLICY IF EXISTS "Enable full access for family members" ON accounts;
DROP POLICY IF EXISTS "Users can view family accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage family accounts" ON accounts;

DROP POLICY IF EXISTS "Enable read access for family members" ON budgets;
DROP POLICY IF EXISTS "Enable full access for family members" ON budgets;
DROP POLICY IF EXISTS "Users can view family budgets" ON budgets;
DROP POLICY IF EXISTS "Users can manage family budgets" ON budgets;

-- Create comprehensive RLS policies for categories
CREATE POLICY "categories_select_policy" ON categories
FOR SELECT USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "categories_insert_policy" ON categories
FOR INSERT WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "categories_update_policy" ON categories
FOR UPDATE USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
) WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "categories_delete_policy" ON categories
FOR DELETE USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

-- Create comprehensive RLS policies for accounts
CREATE POLICY "accounts_select_policy" ON accounts
FOR SELECT USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "accounts_insert_policy" ON accounts
FOR INSERT WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "accounts_update_policy" ON accounts
FOR UPDATE USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
) WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "accounts_delete_policy" ON accounts
FOR DELETE USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

-- Create comprehensive RLS policies for budgets
CREATE POLICY "budgets_select_policy" ON budgets
FOR SELECT USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "budgets_insert_policy" ON budgets
FOR INSERT WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "budgets_update_policy" ON budgets
FOR UPDATE USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
) WITH CHECK (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "budgets_delete_policy" ON budgets
FOR DELETE USING (
    family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);

-- Step 2: Ensure RLS is enabled on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Step 3: Update the family_id trigger function to handle all tables
CREATE OR REPLACE FUNCTION set_family_id() 
RETURNS TRIGGER AS $$
BEGIN
    -- Get family_id from the current user
    NEW.family_id := (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    );
    
    -- Ensure family_id is not null
    IF NEW.family_id IS NULL THEN
        RAISE EXCEPTION 'User must belong to a family to perform this operation';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create triggers for all tables that need family_id
DROP TRIGGER IF EXISTS set_family_id_trigger ON categories;
CREATE TRIGGER set_family_id_trigger
    BEFORE INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_family_id();

DROP TRIGGER IF EXISTS set_family_id_trigger ON accounts;
CREATE TRIGGER set_family_id_trigger
    BEFORE INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION set_family_id();

DROP TRIGGER IF EXISTS set_family_id_trigger ON budgets;
CREATE TRIGGER set_family_id_trigger
    BEFORE INSERT ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION set_family_id();

DROP TRIGGER IF EXISTS set_family_id_trigger ON transactions;
CREATE TRIGGER set_family_id_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_family_id();

-- Step 5: Fix any existing records that might be missing family_id
-- Update categories without family_id
UPDATE categories 
SET family_id = (
    SELECT family_id 
    FROM users 
    WHERE id = auth.uid() 
    LIMIT 1
)
WHERE family_id IS NULL;

-- Update accounts without family_id
UPDATE accounts 
SET family_id = (
    SELECT family_id 
    FROM users 
    WHERE id = auth.uid() 
    LIMIT 1
)
WHERE family_id IS NULL;

-- Update budgets without family_id
UPDATE budgets 
SET family_id = (
    SELECT family_id 
    FROM users 
    WHERE id = auth.uid() 
    LIMIT 1
)
WHERE family_id IS NULL;

-- Update transactions without family_id
UPDATE transactions 
SET family_id = (
    SELECT family_id 
    FROM users 
    WHERE id = auth.uid() 
    LIMIT 1
)
WHERE family_id IS NULL;

-- Step 6: Create helper function to safely delete/archive records
CREATE OR REPLACE FUNCTION safe_archive_category(category_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_family_id UUID;
    category_family_id UUID;
BEGIN
    -- Get current user's family_id
    SELECT family_id INTO user_family_id
    FROM users 
    WHERE id = auth.uid();
    
    -- Get category's family_id
    SELECT family_id INTO category_family_id
    FROM categories 
    WHERE id = category_id;
    
    -- Check if user has access to this category
    IF user_family_id IS NULL OR user_family_id != category_family_id THEN
        RETURN FALSE;
    END IF;
    
    -- Update the category to mark as inactive
    UPDATE categories 
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = category_id AND family_id = user_family_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION safe_archive_account(account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_family_id UUID;
    account_family_id UUID;
BEGIN
    -- Get current user's family_id
    SELECT family_id INTO user_family_id
    FROM users 
    WHERE id = auth.uid();
    
    -- Get account's family_id
    SELECT family_id INTO account_family_id
    FROM accounts 
    WHERE id = account_id;
    
    -- Check if user has access to this account
    IF user_family_id IS NULL OR user_family_id != account_family_id THEN
        RETURN FALSE;
    END IF;
    
    -- Update the account to mark as inactive
    UPDATE accounts 
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = account_id AND family_id = user_family_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Verify everything is working
SELECT 
    'CRUD Operations Fix Applied' as status,
    (SELECT count(*) FROM categories WHERE family_id IS NOT NULL) as categories_with_family,
    (SELECT count(*) FROM accounts WHERE family_id IS NOT NULL) as accounts_with_family,
    (SELECT count(*) FROM budgets WHERE family_id IS NOT NULL) as budgets_with_family,
    auth.uid() as current_user,
    (SELECT family_id FROM users WHERE id = auth.uid()) as user_family_id;