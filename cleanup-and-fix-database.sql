-- Comprehensive database cleanup and fix
-- This will clean up orphaned data and establish proper relationships

-- Step 1: Identify the active family (the one with users)
SELECT f.id as family_id, f.name, f.created_at, 
    (SELECT count(*) FROM users u WHERE u.family_id = f.id) as users_count
FROM families f 
WHERE EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id)
ORDER BY f.created_at DESC 
LIMIT 1;

-- Step 2: Store the active family ID in a variable (we'll need to use the ID from above)
-- Get the active family ID
WITH active_family AS (
    SELECT f.id as family_id
    FROM families f 
    WHERE EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id)
    ORDER BY f.created_at DESC 
    LIMIT 1
)

-- Step 3: Delete orphaned families and their categories
DELETE FROM categories 
WHERE family_id NOT IN (SELECT family_id FROM active_family);

DELETE FROM families 
WHERE id NOT IN (SELECT family_id FROM active_family);

-- Step 4: Clean up duplicate categories for the active family
WITH active_family AS (
    SELECT f.id as family_id
    FROM families f 
    WHERE EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id)
    ORDER BY f.created_at DESC 
    LIMIT 1
),
category_dedup AS (
    SELECT id, 
        ROW_NUMBER() OVER (PARTITION BY name, type ORDER BY created_at ASC) as rn
    FROM categories c, active_family af
    WHERE c.family_id = af.family_id
)
DELETE FROM categories 
WHERE id IN (
    SELECT id FROM category_dedup WHERE rn > 1
);

-- Step 5: Ensure we have basic categories
WITH active_family AS (
    SELECT f.id as family_id
    FROM families f 
    WHERE EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id)
    ORDER BY f.created_at DESC 
    LIMIT 1
)
INSERT INTO categories (family_id, name, type, budget_amount, color, priority_order, description, is_active)
SELECT 
    af.family_id,
    category_data.name,
    category_data.type::category_type,
    category_data.budget_amount,
    category_data.color,
    category_data.priority_order,
    category_data.description,
    true as is_active
FROM active_family af
CROSS JOIN (
    VALUES 
    ('Rent/Mortgage', 'immediate_obligations', 25000, '#ef4444', 1, 'Monthly housing costs'),
    ('Utilities', 'immediate_obligations', 3000, '#f97316', 2, 'Electricity, water, gas, internet'),
    ('Groceries', 'immediate_obligations', 8000, '#eab308', 3, 'Food and household supplies'),
    ('Transportation', 'immediate_obligations', 4000, '#22c55e', 4, 'Fuel, public transport, vehicle maintenance'),
    ('Dining Out', 'quality_of_life', 3000, '#3b82f6', 5, 'Restaurants and food delivery'),
    ('Entertainment', 'just_for_fun', 2000, '#8b5cf6', 6, 'Movies, games, hobbies'),
    ('Salary', 'income', 50000, '#10b981', 7, 'Monthly salary and bonuses')
) as category_data(name, type, budget_amount, color, priority_order, description)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.family_id = af.family_id 
    AND c.name = category_data.name 
    AND c.type = category_data.type::category_type
);

-- Step 6: Show final clean state
SELECT 'Cleanup Complete' as status, 
    (SELECT count(*) FROM families) as families_count,
    (SELECT count(*) FROM users WHERE family_id IS NOT NULL) as users_with_family_count,
    (SELECT count(*) FROM categories) as categories_count,
    (SELECT count(*) FROM budgets) as budgets_count;

-- Step 7: Show the active family and its categories
WITH active_family AS (
    SELECT f.id as family_id, f.name as family_name
    FROM families f 
    WHERE EXISTS (SELECT 1 FROM users u WHERE u.family_id = f.id)
    ORDER BY f.created_at DESC 
    LIMIT 1
)
SELECT 'Active Family' as info, af.family_name, af.family_id,
    (SELECT count(*) FROM categories c WHERE c.family_id = af.family_id) as category_count
FROM active_family af;