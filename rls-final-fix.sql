-- Final RLS Fix with Proper User Handling
-- This version handles existing users properly

-- First, completely disable RLS temporarily and drop all policies
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view own family" ON families;
DROP POLICY IF EXISTS "Admins can update family" ON families;
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;
DROP POLICY IF EXISTS "Allow family creation" ON families;
DROP POLICY IF EXISTS "View own family" ON families;
DROP POLICY IF EXISTS "Admin update family" ON families;
DROP POLICY IF EXISTS "Users can view family members" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update family members" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Create own profile" ON users;
DROP POLICY IF EXISTS "View own profile" ON users;
DROP POLICY IF EXISTS "View family members" ON users;
DROP POLICY IF EXISTS "Update own profile" ON users;
DROP POLICY IF EXISTS "Users can view family accounts" ON accounts;
DROP POLICY IF EXISTS "Members can create accounts" ON accounts;
DROP POLICY IF EXISTS "Members can update accounts" ON accounts;
DROP POLICY IF EXISTS "Admins can delete accounts" ON accounts;
DROP POLICY IF EXISTS "Manage family accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view family categories" ON categories;
DROP POLICY IF EXISTS "Members can create categories" ON categories;
DROP POLICY IF EXISTS "Members can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Manage family categories" ON categories;
DROP POLICY IF EXISTS "Users can view family transactions" ON transactions;
DROP POLICY IF EXISTS "Members can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Manage family transactions" ON transactions;

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS create_family_with_admin;

-- Create a secure stored procedure for family creation that handles existing users
CREATE OR REPLACE FUNCTION create_family_with_admin(
    family_name TEXT,
    user_id UUID,
    user_email TEXT,
    user_display_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    new_family_id UUID;
    existing_user_family_id UUID;
    result JSON;
BEGIN
    -- Check if user already has a family
    SELECT family_id INTO existing_user_family_id
    FROM users
    WHERE id = user_id;
    
    -- If user already has a family, return error
    IF existing_user_family_id IS NOT NULL THEN
        RAISE EXCEPTION 'User already belongs to a family';
    END IF;
    
    -- Insert the family first
    INSERT INTO families (name, settings) 
    VALUES (
        family_name,
        jsonb_build_object(
            'currency', 'INR',
            'date_format', 'DD/MM/YYYY',
            'start_of_week', 1,
            'timezone', 'Asia/Kolkata'
        )
    )
    RETURNING id INTO new_family_id;
    
    -- Insert or update the user as admin
    INSERT INTO users (id, family_id, email, role, display_name)
    VALUES (
        user_id,
        new_family_id,
        user_email,
        'admin',
        COALESCE(user_display_name, split_part(user_email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET
        family_id = new_family_id,
        email = user_email,
        role = 'admin',
        display_name = COALESCE(user_display_name, split_part(user_email, '@', 1));
    
    -- Return the family data
    SELECT row_to_json(f) INTO result
    FROM families f
    WHERE f.id = new_family_id;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, raise an error
        RAISE EXCEPTION 'Failed to create family: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION create_family_with_admin TO authenticated;

-- Now create simplified RLS policies that won't cause recursion

-- ====================
-- FAMILIES TABLE
-- ====================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create families (handled by stored procedure)
CREATE POLICY "Allow family creation" ON families
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can view families where they exist in the users table
CREATE POLICY "View own family" ON families
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.family_id = families.id 
            AND users.id = auth.uid()
        )
    );

-- Admins can update their family
CREATE POLICY "Admin update family" ON families
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.family_id = families.id 
            AND users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- ====================
-- USERS TABLE  
-- ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to create their own profile (via stored procedure)
CREATE POLICY "Create own profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Users can view their own profile
CREATE POLICY "View own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Users can view family members
CREATE POLICY "View family members" ON users
    FOR SELECT USING (
        family_id IN (
            SELECT family_id FROM users u2 WHERE u2.id = auth.uid()
        )
    );

-- Users can update their own profile
CREATE POLICY "Update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- ====================
-- ACCOUNTS TABLE
-- ====================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage family accounts" ON accounts
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM users WHERE id = auth.uid()
        )
    );

-- ====================
-- CATEGORIES TABLE
-- ====================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage family categories" ON categories
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM users WHERE id = auth.uid()
        )
    );

-- ====================
-- TRANSACTIONS TABLE
-- ====================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage family transactions" ON transactions
    FOR ALL USING (
        family_id IN (
            SELECT family_id FROM users WHERE id = auth.uid()
        )
    );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;