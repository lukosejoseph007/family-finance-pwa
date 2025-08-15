-- Diagnostic script to check actual table structures
-- Run this first to see what we're working with

-- Check if tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'families')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as families_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as users_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as categories_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as accounts_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as transactions_table;

-- Check actual columns in categories table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Check actual columns in accounts table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'accounts'
ORDER BY ordinal_position;

-- Check actual columns in transactions table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Check current data counts
SELECT 
    (SELECT count(*) FROM families) as families_count,
    (SELECT count(*) FROM users) as users_count,
    (SELECT count(*) FROM categories) as categories_count,
    (SELECT count(*) FROM accounts) as accounts_count,
    (SELECT count(*) FROM transactions) as transactions_count;

-- Check family context
SELECT 
    f.id as family_id,
    f.name as family_name,
    f.created_at,
    (SELECT count(*) FROM users u WHERE u.family_id = f.id) as users_count
FROM families f
ORDER BY f.created_at DESC;