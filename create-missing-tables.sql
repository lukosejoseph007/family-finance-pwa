-- Check if categories table exists and create it if missing
-- This will fix the "column does not exist" error

-- Check if categories table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories')
        THEN 'Categories table EXISTS'
        ELSE 'Categories table MISSING'
    END as categories_status;

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('immediate_obligations', 'true_expenses', 'quality_of_life', 'just_for_fun', 'income')),
    budget_amount NUMERIC(10,2) DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    priority_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if accounts table exists and create it if missing
CREATE TABLE IF NOT EXISTS accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'loan')),
    balance NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if transactions table exists and create it if missing
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

-- Now fix the family context and add default categories
-- Clean up any orphaned data
DELETE FROM users WHERE family_id IS NULL;

-- Update users to have the latest family_id if they don't have one
UPDATE users 
SET family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1) 
WHERE family_id IS NULL;

-- Create default categories for the family (using correct columns)
INSERT INTO categories (family_id, name, type, budget_amount, color, priority_order, is_active)
SELECT 
    f.id as family_id,
    category_data.name,
    category_data.type,
    category_data.budget_amount,
    category_data.color,
    category_data.priority_order,
    true as is_active
FROM families f
CROSS JOIN (
    VALUES 
    ('Rent/Mortgage', 'immediate_obligations', 25000, '#ef4444', 1),
    ('Utilities', 'immediate_obligations', 3000, '#f97316', 2),
    ('Groceries', 'immediate_obligations', 8000, '#eab308', 3),
    ('Transportation', 'immediate_obligations', 4000, '#22c55e', 4),
    ('Dining Out', 'quality_of_life', 3000, '#3b82f6', 5),
    ('Entertainment', 'just_for_fun', 2000, '#8b5cf6', 6),
    ('Salary', 'income', 0, '#10b981', 7)
) as category_data(name, type, budget_amount, color, priority_order)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.family_id = f.id
);

-- Show final state
SELECT 'Final Check - Tables created' as status, 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN 'YES' ELSE 'NO' END as categories_exists,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN 'YES' ELSE 'NO' END as accounts_exists,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN 'YES' ELSE 'NO' END as transactions_exists;

SELECT 'Final Check - Data' as status, 
    (SELECT count(*) FROM families) as families_count,
    (SELECT count(*) FROM users WHERE family_id IS NOT NULL) as users_with_family,
    (SELECT count(*) FROM categories) as categories_count;