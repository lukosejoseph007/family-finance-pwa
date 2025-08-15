-- Row Level Security (RLS) Policies for Family Finance PWA
-- Run this SQL in your Supabase SQL Editor to enable secure multi-family access

-- Enable Row Level Security on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;

-- ====================
-- FAMILIES TABLE POLICIES
-- ====================

-- Users can only see families they belong to
CREATE POLICY "Users can view own family" ON families
    FOR SELECT USING (
        id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Only family admins can update family settings
CREATE POLICY "Admins can update family" ON families
    FOR UPDATE USING (
        id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow authenticated users to create new families (for initial setup)
CREATE POLICY "Authenticated users can create families" ON families
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ====================
-- USERS TABLE POLICIES
-- ====================

-- Users can view other users in their family
CREATE POLICY "Users can view family members" ON users
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Family admins can update any user in their family
CREATE POLICY "Admins can update family members" ON users
    FOR UPDATE USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow authenticated users to insert their own user record
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- ====================
-- ACCOUNTS TABLE POLICIES
-- ====================

-- Users can view accounts in their family
CREATE POLICY "Users can view family accounts" ON accounts
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Family members and admins can create accounts
CREATE POLICY "Members can create accounts" ON accounts
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'member')
        )
    );

-- Family members and admins can update accounts
CREATE POLICY "Members can update accounts" ON accounts
    FOR UPDATE USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'member')
        )
    );

-- Only admins can delete accounts
CREATE POLICY "Admins can delete accounts" ON accounts
    FOR DELETE USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ====================
-- CATEGORIES TABLE POLICIES
-- ====================

-- Users can view categories in their family
CREATE POLICY "Users can view family categories" ON categories
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Family members and admins can create categories
CREATE POLICY "Members can create categories" ON categories
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'member')
        )
    );

-- Family members and admins can update categories
CREATE POLICY "Members can update categories" ON categories
    FOR UPDATE USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'member')
        )
    );

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ====================
-- TRANSACTIONS TABLE POLICIES
-- ====================

-- Users can view transactions in their family
CREATE POLICY "Users can view family transactions" ON transactions
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Family members and admins can create transactions
CREATE POLICY "Members can create transactions" ON transactions
    FOR INSERT WITH CHECK (
        family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'member')
        )
    );

-- Users can update transactions they created, admins can update any
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (
        (user_id = auth.uid()) OR 
        (family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    );

-- Users can delete transactions they created, admins can delete any
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (
        (user_id = auth.uid()) OR 
        (family_id IN (
            SELECT family_id FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        ))
    );

-- ====================
-- SESSION TABLE POLICIES
-- ====================

-- Users can only access their own sessions
CREATE POLICY "Users can access own sessions" ON session
    FOR ALL USING (user_id = auth.uid()::text);

-- ====================
-- HELPER FUNCTIONS
-- ====================

-- Function to check if user is admin of a family
CREATE OR REPLACE FUNCTION is_family_admin(family_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND family_id = family_uuid 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's family ID
CREATE OR REPLACE FUNCTION get_user_family_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT family_id FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================
-- ROLE-BASED ACCESS SUMMARY
-- ====================

/*
VIEWER ROLE:
- Can view all family data (accounts, categories, transactions)
- Cannot create, update, or delete anything

MEMBER ROLE:
- Can view all family data
- Can create/update accounts, categories, and transactions
- Can update own profile
- Cannot delete accounts or categories
- Can delete own transactions

ADMIN ROLE:
- Full access to all family data
- Can manage all users in the family
- Can delete accounts and categories
- Can update family settings
- Can delete any transactions
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;