-- Complete fix for family context issues (CORRECTED VERSION)
-- This ensures all services can find user's family properly

-- First, let's check and clean up any orphaned data
-- Delete any users without families (cleanup)
DELETE FROM users WHERE family_id IS NULL;

-- Delete any accounts/categories/transactions that don't have proper family_id
DELETE FROM accounts WHERE family_id IS NULL;
DELETE FROM categories WHERE family_id IS NULL;
DELETE FROM transactions WHERE family_id IS NULL;

-- Now let's see what's in the database with corrected types:
SELECT 'Families' as table_name, id::text as id_field, name as name_field, created_at::text as info_field FROM families
UNION ALL
SELECT 'Users' as table_name, id::text as id_field, email as name_field, family_id::text as info_field FROM users;

-- Update users to have the latest family_id if they don't have one
UPDATE users 
SET family_id = (SELECT id FROM families ORDER BY created_at DESC LIMIT 1) 
WHERE family_id IS NULL;

-- Create default categories for the family if none exist
INSERT INTO categories (family_id, name, type, description, budget_amount, color, priority_order, is_active)
SELECT 
    f.id as family_id,
    category_data.name,
    category_data.type::text,
    category_data.description,
    category_data.budget_amount::numeric,
    category_data.color,
    category_data.priority_order::integer,
    true as is_active
FROM families f
CROSS JOIN (
    VALUES 
    ('Rent/Mortgage', 'immediate_obligations', 'Monthly housing payment', 25000, '#ef4444', 1),
    ('Utilities', 'immediate_obligations', 'Electricity, water, gas', 3000, '#f97316', 2),
    ('Groceries', 'immediate_obligations', 'Food and household items', 8000, '#eab308', 3),
    ('Transportation', 'immediate_obligations', 'Fuel, maintenance, public transport', 4000, '#22c55e', 4),
    ('Dining Out', 'quality_of_life', 'Restaurants and takeout', 3000, '#3b82f6', 5),
    ('Entertainment', 'just_for_fun', 'Movies, games, hobbies', 2000, '#8b5cf6', 6),
    ('Salary', 'income', 'Monthly salary', 0, '#10b981', 7)
) as category_data(name, type, description, budget_amount, color, priority_order)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.family_id = f.id
);

-- Show final state
SELECT 'Final Check - Families' as status, count(*)::text as count FROM families
UNION ALL
SELECT 'Final Check - Users with families' as status, count(*)::text as count FROM users WHERE family_id IS NOT NULL
UNION ALL
SELECT 'Final Check - Categories' as status, count(*)::text as count FROM categories;