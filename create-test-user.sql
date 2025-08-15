-- Create a test user for testing CRUD operations
-- This will insert a test user directly into the auth.users table and create associated records

-- Step 1: Insert test user into auth.users (simulating Supabase auth)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create a test family
INSERT INTO families (id, name, description, created_by, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Test Family',
    'Test family for CRUD operations',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Create user record in our users table
INSERT INTO users (id, email, full_name, family_id, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    'Test User',
    '00000000-0000-0000-0000-000000000002',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    family_id = EXCLUDED.family_id,
    updated_at = NOW();

-- Step 4: Create some test accounts with proper family_id
INSERT INTO accounts (id, family_id, name, type, balance, is_active, created_at, updated_at)
VALUES 
    ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Test Checking', 'checking', 10000.00, true, NOW(), NOW()),
    ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Test Savings', 'savings', 50000.00, true, NOW(), NOW()),
    ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Test Credit Card', 'credit_card', -5000.00, true, NOW(), NOW()),
    ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Test Cash', 'cash', 2000.00, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    family_id = EXCLUDED.family_id,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    balance = EXCLUDED.balance,
    updated_at = NOW();

-- Step 5: Create some test categories with proper family_id
INSERT INTO categories (id, family_id, name, type, description, budget_amount, is_active, created_at, updated_at)
VALUES 
    ('22222222-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Test Groceries', 'immediate_obligations', 'Test grocery category', 5000.00, true, NOW(), NOW()),
    ('22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Test Rent', 'immediate_obligations', 'Test rent category', 15000.00, true, NOW(), NOW()),
    ('22222222-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Test Entertainment', 'just_for_fun', 'Test entertainment category', 3000.00, true, NOW(), NOW()),
    ('22222222-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Test Salary', 'income', 'Test salary income', 50000.00, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    family_id = EXCLUDED.family_id,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    budget_amount = EXCLUDED.budget_amount,
    updated_at = NOW();

-- Step 6: Verification
SELECT 
    'Test User Created Successfully' as status,
    (SELECT count(*) FROM accounts WHERE family_id = '00000000-0000-0000-0000-000000000002') as test_accounts,
    (SELECT count(*) FROM categories WHERE family_id = '00000000-0000-0000-0000-000000000002') as test_categories,
    (SELECT count(*) FROM families WHERE id = '00000000-0000-0000-0000-000000000002') as test_families,
    (SELECT count(*) FROM users WHERE family_id = '00000000-0000-0000-0000-000000000002') as test_users;

-- Step 7: Show login credentials
SELECT 
    'Use these credentials to test CRUD operations:' as instructions,
    'test@example.com' as email,
    'password123' as password,
    'Note: You may need to create this user via the signup form first' as note;