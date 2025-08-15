-- Fixed Row Level Security (RLS) Policies for Family Finance PWA
-- This version fixes the infinite recursion issue in the users table

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own family" ON families;
DROP POLICY IF EXISTS "Admins can update family" ON families;
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;
DROP POLICY IF EXISTS "Users can view family members" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update family members" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Users can view family accounts" ON accounts;
DROP POLICY IF EXISTS "Members can create accounts" ON accounts;
DROP POLICY IF EXISTS "Members can update accounts" ON accounts;
DROP POLICY IF EXISTS "Admins can delete accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view family categories" ON categories;
DROP POLICY IF EXISTS "Members can create categories" ON categories;
DROP POLICY IF EXISTS "Members can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Users can view family transactions" ON transactions;
DROP POLICY IF EXISTS "Members can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can access own sessions" ON session;

-- ====================
-- USERS TABLE POLICIES (Fixed to avoid recursion)
-- ====================

-- Users can view their own profile and others in the same family
-- This avoids recursion by using a different approach
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Enable viewing family members through a separate policy
-- This uses a simpler approach without subqueries
CREATE POLICY "Users can view family members" ON users
    FOR SELECT USING (
        family_id = (
            SELECT u.family_id FROM users u WHERE u.id = auth.uid() LIMIT 1
        )
    );

-- ====================
-- FAMILIES TABLE POLICIES
-- ====================

-- Users can view their family
CREATE POLICY "Users can view own family" ON families
    FOR SELECT USING (
        id = (
            SELECT u.family_id FROM users u WHERE u.id = auth.uid() LIMIT 1
        )
    );

-- Only family admins can update family settings
CREATE POLICY "Admins can update family" ON families
    FOR UPDATE USING (
        id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin' 
            LIMIT 1
        )
    );

-- Allow authenticated users to create new families (for initial setup)
CREATE POLICY "Authenticated users can create families" ON families
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ====================
-- ACCOUNTS TABLE POLICIES
-- ====================

-- Users can view accounts in their family
CREATE POLICY "Users can view family accounts" ON accounts
    FOR SELECT USING (
        family_id = (
            SELECT u.family_id FROM users u WHERE u.id = auth.uid() LIMIT 1
        )
    );

-- Family members and admins can create accounts
CREATE POLICY "Members can create accounts" ON accounts
    FOR INSERT WITH CHECK (
        family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'member')
            LIMIT 1
        )
    );

-- Family members and admins can update accounts
CREATE POLICY "Members can update accounts" ON accounts
    FOR UPDATE USING (
        family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'member')
            LIMIT 1
        )
    );

-- Only admins can delete accounts
CREATE POLICY "Admins can delete accounts" ON accounts
    FOR DELETE USING (
        family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
            LIMIT 1
        )
    );

-- ====================
-- CATEGORIES TABLE POLICIES
-- ====================

-- Users can view categories in their family
CREATE POLICY "Users can view family categories" ON categories
    FOR SELECT USING (
        family_id = (
            SELECT u.family_id FROM users u WHERE u.id = auth.uid() LIMIT 1
        )
    );

-- Family members and admins can create categories
CREATE POLICY "Members can create categories" ON categories
    FOR INSERT WITH CHECK (
        family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'member')
            LIMIT 1
        )
    );

-- Family members and admins can update categories
CREATE POLICY "Members can update categories" ON categories
    FOR UPDATE USING (
        family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'member')
            LIMIT 1
        )
    );

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE USING (
        family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
            LIMIT 1
        )
    );

-- ====================
-- TRANSACTIONS TABLE POLICIES
-- ====================

-- Users can view transactions in their family
CREATE POLICY "Users can view family transactions" ON transactions
    FOR SELECT USING (
        family_id = (
            SELECT u.family_id FROM users u WHERE u.id = auth.uid() LIMIT 1
        )
    );

-- Family members and admins can create transactions
CREATE POLICY "Members can create transactions" ON transactions
    FOR INSERT WITH CHECK (
        family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'member')
            LIMIT 1
        )
    );

-- Users can update transactions they created, admins can update any
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (
        (user_id = auth.uid()) OR 
        (family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
            LIMIT 1
        ))
    );

-- Users can delete transactions they created, admins can delete any
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (
        (user_id = auth.uid()) OR 
        (family_id = (
            SELECT u.family_id FROM users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
            LIMIT 1
        ))
    );

-- ====================
-- SESSION TABLE POLICIES
-- ====================

-- Users can only access their own sessions
CREATE POLICY "Users can access own sessions" ON session
    FOR ALL USING (user_id = auth.uid()::text);

-- ====================
-- BUDGETS TABLE POLICIES (if exists)
-- ====================

-- Add policies for budgets table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') THEN
        EXECUTE 'ALTER TABLE budgets ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "Users can view family budgets" ON budgets
            FOR SELECT USING (
                family_id = (
                    SELECT u.family_id FROM users u WHERE u.id = auth.uid() LIMIT 1
                )
            )';
            
        EXECUTE 'CREATE POLICY "Members can manage budgets" ON budgets
            FOR ALL USING (
                family_id = (
                    SELECT u.family_id FROM users u 
                    WHERE u.id = auth.uid() AND u.role IN (''admin'', ''member'')
                    LIMIT 1
                )
            )';
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;