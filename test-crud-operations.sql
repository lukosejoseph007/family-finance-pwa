-- Test script to verify all CRUD operations work
-- Run this after applying fix-all-crud-operations.sql

-- Test 1: Create a test category
INSERT INTO categories (name, type, description, budget_amount, is_active) 
VALUES ('Test Category', 'immediate_obligations', 'Test category for CRUD operations', 1000, true);

-- Test 2: Create an income category
INSERT INTO categories (name, type, description, budget_amount, is_active) 
VALUES ('Test Income', 'income', 'Test income category', 50000, true);

-- Test 3: Create a test account
INSERT INTO accounts (name, type, balance, is_active)
VALUES ('Test Account', 'checking', 10000, true);

-- Test 4: Create a test budget for current month
INSERT INTO budgets (category_id, month_year, allocated_amount, spent_amount, available_amount)
SELECT 
    c.id,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    1000,
    0,
    1000
FROM categories c 
WHERE c.name = 'Test Category' 
LIMIT 1;

-- Test 5: Verify SELECT operations work
SELECT 'SELECT Test' as test_type, 
       (SELECT count(*) FROM categories) as categories_count,
       (SELECT count(*) FROM accounts) as accounts_count,
       (SELECT count(*) FROM budgets) as budgets_count;

-- Test 6: Test UPDATE operations
UPDATE categories 
SET budget_amount = 1500 
WHERE name = 'Test Category';

UPDATE accounts 
SET balance = 15000 
WHERE name = 'Test Account';

-- Test 7: Test soft DELETE (archive) operations
UPDATE categories 
SET is_active = false 
WHERE name = 'Test Category';

UPDATE accounts 
SET is_active = false 
WHERE name = 'Test Account';

-- Test 8: Test reactivation
UPDATE categories 
SET is_active = true 
WHERE name = 'Test Category';

-- Test 9: Clean up test data
DELETE FROM budgets 
WHERE category_id IN (
    SELECT id FROM categories 
    WHERE name IN ('Test Category', 'Test Income')
);

DELETE FROM categories 
WHERE name IN ('Test Category', 'Test Income');

DELETE FROM accounts 
WHERE name = 'Test Account';

-- Test 10: Final verification
SELECT 
    'CRUD Tests Completed' as status,
    (SELECT count(*) FROM categories WHERE is_active = true) as active_categories,
    (SELECT count(*) FROM accounts WHERE is_active = true) as active_accounts,
    (SELECT count(*) FROM budgets) as total_budgets,
    auth.uid() as current_user_id,
    (SELECT family_id FROM users WHERE id = auth.uid()) as user_family_id;