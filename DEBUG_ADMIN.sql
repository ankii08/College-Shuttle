-- DEBUG ADMIN ACCESS ISSUE
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Check if the user exists and get their details
SELECT 
    id, 
    email, 
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'admin@sewanee.edu';

-- 2. Check if user_roles table exists and has the right structure
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
) as user_roles_table_exists;

-- 3. Check the user_roles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if there's a role assigned to our admin user
SELECT 
    u.id as user_id,
    u.email,
    ur.role,
    ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@sewanee.edu';

-- 5. Check all users and their roles (for debugging)
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC;

-- 6. If the role is missing, insert it (FORCE INSERT)
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@sewanee.edu';
    
    IF admin_user_id IS NOT NULL THEN
        -- Delete any existing role first
        DELETE FROM public.user_roles WHERE user_id = admin_user_id;
        
        -- Insert the admin role
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES (admin_user_id, 'admin', now());
        
        RAISE NOTICE 'Forced admin role insertion for user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'User admin@sewanee.edu not found!';
    END IF;
END $$;

-- 7. Final verification
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@sewanee.edu';

-- 8. Check RLS policies on user_roles (this might be the issue!)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_roles';
