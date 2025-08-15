-- Fix database schema by adding missing columns and tables
-- This will resolve all the column errors with correct enum casting

-- 1. Add missing columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'loan')),
    balance NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    memo TEXT,
    is_cleared BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Clean up family context - ensure users have family_id
UPDATE users 
SET family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1) 
WHERE family_id IS NULL;

-- 5. Add default categories only if none exist for active families (with correct enum casting)
INSERT INTO categories (family_id, name, type, budget_amount, color, priority_order, description, is_active)
SELECT 
    f.id as family_id,
    category_data.name,
    category_data.type::category_type,  -- Cast to enum type
    category_data.budget_amount,
    category_data.color,
    category_data.priority_order,
    category_data.description,
    true as is_active
FROM families f
CROSS JOIN (
    VALUES 
    ('Rent/Mortgage', 'immediate_obligations', 25000, '#ef4444', 1, 'Monthly housing costs'),
    ('Utilities', 'immediate_obligations', 3000, '#f97316', 2, 'Electricity, water, gas, internet'),
    ('Groceries', 'immediate_obligations', 8000, '#eab308', 3, 'Food and household supplies'),
    ('Transportation', 'immediate_obligations', 4000, '#22c55e', 4, 'Fuel, public transport, vehicle maintenance'),
    ('Dining Out', 'quality_of_life', 3000, '#3b82f6', 5, 'Restaurants and food delivery'),
    ('Entertainment', 'just_for_fun', 2000, '#8b5cf6', 6, 'Movies, games, hobbies'),
    ('Salary', 'income', 0, '#10b981', 7, 'Monthly salary and bonuses')
) as category_data(name, type, budget_amount, color, priority_order, description)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.family_id = f.id
);

-- 6. Create RLS policies for new tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Accounts policies
DROP POLICY IF EXISTS "Users can view family accounts" ON accounts;
CREATE POLICY "Users can view family accounts" ON accounts FOR SELECT 
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage family accounts" ON accounts;
CREATE POLICY "Users can manage family accounts" ON accounts FOR ALL 
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Transactions policies  
DROP POLICY IF EXISTS "Users can view family transactions" ON transactions;
CREATE POLICY "Users can view family transactions" ON transactions FOR SELECT 
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage family transactions" ON transactions;
CREATE POLICY "Users can manage family transactions" ON transactions FOR ALL 
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- 7. Show final status
SELECT 
    'Schema Fix Complete' as status,
    (SELECT count(*) FROM families) as families_count,
    (SELECT count(*) FROM users WHERE family_id IS NOT NULL) as users_with_family,
    (SELECT count(*) FROM categories) as categories_count,
    (SELECT count(*) FROM accounts) as accounts_count,
    (SELECT count(*) FROM transactions) as transactions_count;

-- 8. Show categories structure to verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;