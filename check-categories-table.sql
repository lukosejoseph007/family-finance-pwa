-- Simple diagnostic to check categories table structure
-- Run this to see what columns exist in categories table

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'categories'
ORDER BY ordinal_position;