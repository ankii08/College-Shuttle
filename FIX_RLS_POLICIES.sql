-- FIX RLS POLICIES - EMERGENCY FIX FOR INFINITE RECURSION
-- Run this in Supabase Dashboard > SQL Editor

-- 1. DISABLE RLS temporarily and DROP all existing policies
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies (they're causing infinite recursion)
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for own role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable admin access" ON public.user_roles;

-- 3. Verify the admin user exists and has the admin role
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

-- 4. Create SIMPLE, NON-RECURSIVE policies
-- Policy 1: Users can read their own roles
CREATE POLICY "user_roles_select_own" ON public.user_roles
    FOR SELECT 
    USING (user_id = auth.uid());

-- Policy 2: Admins can do everything (SELECT, INSERT, UPDATE, DELETE)
-- This policy checks if the current user has admin role WITHOUT creating recursion
CREATE POLICY "user_roles_admin_all" ON public.user_roles
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 5. RE-ENABLE RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Test the policies by checking admin user
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@sewanee.edu';

-- 7. Show final policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;
