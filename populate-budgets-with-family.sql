-- Populate budgets table with proper family_id relationships
-- This ensures RLS policies work correctly

-- First, let's see what we have
SELECT 'Current state' as status, 
    (SELECT count(*) FROM families) as families_count,
    (SELECT count(*) FROM users WHERE family_id IS NOT NULL) as users_with_family_count,
    (SELECT count(*) FROM categories) as categories_count,
    (SELECT count(*) FROM budgets) as budgets_count;

-- Get the latest family (the one with users)
SELECT f.id, f.name, 
    (SELECT count(*) FROM users u WHERE u.family_id = f.id) as user_count,
    (SELECT count(*) FROM categories c WHERE c.family_id = f.id) as category_count
FROM families f 
ORDER BY f.created_at DESC;

-- Show any missing family_id relationships
SELECT 'Missing family_id relationships' as issue_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM budgets WHERE family_id IS NULL) 
        THEN 'budgets table has NULL family_id entries'
        ELSE 'all budgets have family_id'
    END as budgets_family_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM categories WHERE family_id IS NULL) 
        THEN 'categories table has NULL family_id entries'
        ELSE 'all categories have family_id'
    END as categories_family_status;

-- Update any budgets that might be missing family_id
UPDATE budgets 
SET family_id = (
    SELECT c.family_id 
    FROM categories c 
    WHERE c.id = budgets.category_id 
    LIMIT 1
)
WHERE family_id IS NULL;

-- Show final state
SELECT 'Final state' as status, 
    (SELECT count(*) FROM families) as families_count,
    (SELECT count(*) FROM users WHERE family_id IS NOT NULL) as users_with_family_count,
    (SELECT count(*) FROM categories) as categories_count,
    (SELECT count(*) FROM budgets) as budgets_count,
    (SELECT count(*) FROM budgets WHERE family_id IS NOT NULL) as budgets_with_family_count;