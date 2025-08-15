-- Simple step-by-step database cleanup
-- Run each section separately if needed

-- Step 1: Find the active family ID
SELECT f.id as active_family_id, f.name, f.created_at, 
    (SELECT count(*) FROM users u WHERE u.family_id = f.id) as users_count
FROM families f 
WHERE EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id)
ORDER BY f.created_at DESC 
LIMIT 1;

-- Step 2: Delete categories from orphaned families (replace with actual family ID from step 1)
-- First, let's see what we have
SELECT 'Before cleanup' as status,
    (SELECT count(*) FROM families) as total_families,
    (SELECT count(*) FROM families WHERE EXISTS (SELECT 1 FROM users u WHERE u.family_id = families.id)) as families_with_users,
    (SELECT count(*) FROM categories) as total_categories;

-- Delete categories from families that have no users
DELETE FROM categories 
WHERE family_id IN (
    SELECT f.id FROM families f 
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id)
);

-- Delete orphaned families
DELETE FROM families 
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.family_id = families.id);

-- Step 3: Remove duplicate categories in the active family
WITH duplicate_categories AS (
    SELECT id, 
        ROW_NUMBER() OVER (PARTITION BY name, type, family_id ORDER BY created_at ASC) as rn
    FROM categories
)
DELETE FROM categories 
WHERE id IN (
    SELECT id FROM duplicate_categories WHERE rn > 1
);

-- Step 4: Show current state after cleanup
SELECT 'After cleanup' as status,
    (SELECT count(*) FROM families) as total_families,
    (SELECT count(*) FROM categories) as total_categories,
    (SELECT count(*) FROM users WHERE family_id IS NOT NULL) as users_with_family;

-- Step 5: Show categories by type for active family
SELECT type, count(*) as count, 
    string_agg(name, ', ' ORDER BY name) as category_names
FROM categories 
GROUP BY type 
ORDER BY type;