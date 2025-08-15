-- Check the actual structure of the categories table
-- This will show us what columns really exist

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check the families and users table structure
SELECT 'families' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'families' 
AND table_schema = 'public'
UNION ALL
SELECT 'users' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY table_name, column_name;