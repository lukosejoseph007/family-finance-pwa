-- Comprehensive fix for RLS policies to resolve 403 errors
-- This will ensure all tables work correctly with family-based access

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view family transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage family transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view family accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage family accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view family budgets" ON budgets;
DROP POLICY IF EXISTS "Users can manage family budgets" ON budgets;
DROP POLICY IF EXISTS "Users can view family categories" ON categories;
DROP POLICY IF EXISTS "Users can manage family categories" ON categories;

-- Step 2: Create simple, working RLS policies for transactions
CREATE POLICY "Enable read access for family members" ON transactions
FOR SELECT USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable insert access for family members" ON transactions
FOR INSERT WITH CHECK (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable update access for family members" ON transactions
FOR UPDATE USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable delete access for family members" ON transactions
FOR DELETE USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Step 3: Create RLS policies for accounts
CREATE POLICY "Enable read access for family members" ON accounts
FOR SELECT USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable full access for family members" ON accounts
FOR ALL USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Step 4: Create RLS policies for budgets
CREATE POLICY "Enable read access for family members" ON budgets
FOR SELECT USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable full access for family members" ON budgets
FOR ALL USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Step 5: Create RLS policies for categories
CREATE POLICY "Enable read access for family members" ON categories
FOR SELECT USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

CREATE POLICY "Enable full access for family members" ON categories
FOR ALL USING (
    family_id = (
        SELECT family_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Step 6: Ensure all tables have RLS enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 7: Create function to auto-set family_id on inserts
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

-- Step 8: Create triggers to auto-set family_id
DROP TRIGGER IF EXISTS set_family_id_trigger ON transactions;
CREATE TRIGGER set_family_id_trigger
    BEFORE INSERT ON transactions
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

-- Step 9: Show final verification
SELECT 'RLS Policies Fixed' as status,
    (SELECT count(*) FROM families) as families_count,
    (SELECT count(*) FROM users WHERE family_id IS NOT NULL) as users_with_family,
    auth.uid() as current_user_id,
    (SELECT family_id FROM users WHERE id = auth.uid()) as current_user_family_id;

-- Step 10: Test queries that should work now
SELECT 'Transaction Access Test' as test,
    (SELECT count(*) FROM transactions) as transactions_accessible,
    (SELECT count(*) FROM accounts) as accounts_accessible,
    (SELECT count(*) FROM categories) as categories_accessible,
    (SELECT count(*) FROM budgets) as budgets_accessible;