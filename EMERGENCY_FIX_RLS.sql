-- EMERGENCY FIX - COMPLETELY DISABLE RLS AND USE SIMPLE APPROACH
-- Run this in Supabase Dashboard > SQL Editor

-- 1. COMPLETELY DISABLE RLS on user_roles table
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to prevent any conflicts
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for own role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable admin access" ON public.user_roles;

-- 3. Clear and recreate admin role
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@sewanee.edu';
    
    IF admin_user_id IS NOT NULL THEN
        -- Delete ALL existing roles for this user
        DELETE FROM public.user_roles WHERE user_id = admin_user_id;
        
        -- Insert fresh admin role
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES (admin_user_id, 'admin', now());
        
        RAISE NOTICE 'Admin role created for user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'ERROR: User admin@sewanee.edu not found in auth.users!';
    END IF;
END $$;

-- 4. Verify the data is there
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@sewanee.edu';

-- 5. Test that we can query user_roles table directly
SELECT * FROM public.user_roles;

-- 6. DO NOT re-enable RLS - leave it disabled for now
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Final notice
DO $$
BEGIN
    RAISE NOTICE 'RLS has been DISABLED on user_roles table. This allows full access to test the functionality.';
END $$;
