-- Updated RLS Fix that allows replacing family membership
-- This version allows users to create new families even if they already belong to one

-- Drop the old function
DROP FUNCTION IF EXISTS create_family_with_admin;

-- Create a more flexible stored procedure that allows family replacement
CREATE OR REPLACE FUNCTION create_family_with_admin(
    family_name TEXT,
    user_id UUID,
    user_email TEXT,
    user_display_name TEXT DEFAULT NULL,
    allow_replace BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    new_family_id UUID;
    existing_user_family_id UUID;
    result JSON;
BEGIN
    -- Check if user already has a family
    SELECT family_id INTO existing_user_family_id
    FROM users
    WHERE id = user_id;
    
    -- If user already has a family and replace is not allowed, return error
    IF existing_user_family_id IS NOT NULL AND NOT allow_replace THEN
        RAISE EXCEPTION 'User already belongs to a family. Set allow_replace to true to create a new family.';
    END IF;
    
    -- Insert the family first
    INSERT INTO families (name, settings) 
    VALUES (
        family_name,
        jsonb_build_object(
            'currency', 'INR',
            'date_format', 'DD/MM/YYYY',
            'start_of_week', 1,
            'timezone', 'Asia/Kolkata'
        )
    )
    RETURNING id INTO new_family_id;
    
    -- Insert or update the user as admin (replace existing family membership)
    INSERT INTO users (id, family_id, email, role, display_name)
    VALUES (
        user_id,
        new_family_id,
        user_email,
        'admin',
        COALESCE(user_display_name, split_part(user_email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE SET
        family_id = new_family_id,
        email = user_email,
        role = 'admin',
        display_name = COALESCE(user_display_name, split_part(user_email, '@', 1));
    
    -- Return the family data
    SELECT row_to_json(f) INTO result
    FROM families f
    WHERE f.id = new_family_id;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, raise an error
        RAISE EXCEPTION 'Failed to create family: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION create_family_with_admin TO authenticated;