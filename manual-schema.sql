-- Family Finance PWA Database Schema
-- Run this SQL in your Supabase SQL Editor to create the database tables

-- Create ENUMs first
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit_card', 'cash', 'investment', 'loan');
CREATE TYPE category_type AS ENUM ('immediate_obligations', 'true_expenses', 'quality_of_life', 'just_for_fun', 'income');

-- Create TABLES

-- 1. Families table (no dependencies)
CREATE TABLE families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{
        "currency": "USD",
        "date_format": "MM/DD/YYYY", 
        "start_of_week": 0,
        "timezone": "UTC"
    }'::jsonb
);

-- 2. Users table (depends on families)
CREATE TABLE users (
    id UUID PRIMARY KEY, -- References auth.users(id)
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'member',
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Accounts table (depends on families)
CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type account_type NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Categories table (depends on families, self-referencing)
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type category_type NOT NULL,
    color TEXT DEFAULT '#6366f1',
    priority_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL
);

-- 5. Transactions table (depends on all above tables)
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    memo TEXT,
    is_cleared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sessions table (for auth)
CREATE TABLE session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_accounts_family_id ON accounts(family_id);
CREATE INDEX idx_categories_family_id ON categories(family_id);
CREATE INDEX idx_transactions_family_id ON transactions(family_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_session_user_id ON session(user_id);

-- Comments for documentation
COMMENT ON TABLE families IS 'Family groups that contain users and financial data';
COMMENT ON TABLE users IS 'Users within families, linked to Supabase auth.users';
COMMENT ON TABLE accounts IS 'Financial accounts (checking, savings, etc.)';
COMMENT ON TABLE categories IS 'Expense and income categories for transactions';
COMMENT ON TABLE transactions IS 'Individual financial transactions';
COMMENT ON TABLE session IS 'User authentication sessions';