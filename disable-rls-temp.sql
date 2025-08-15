-- Temporarily disable RLS for testing functionality
-- This allows full access to test all features
-- WARNING: Only use for development/testing

-- Disable RLS on all tables
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Also disable on budgets table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') THEN
        EXECUTE 'ALTER TABLE budgets DISABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Also disable on session table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session') THEN
        EXECUTE 'ALTER TABLE session DISABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Also disable on goals table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
        EXECUTE 'ALTER TABLE goals DISABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- Note: This is for testing only
-- In production, you would need proper RLS policies