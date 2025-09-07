-- ADMIN ACCESS FIX SCRIPT
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: First check if user exists
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@sewanee.edu';

-- Step 2: If user exists, assign admin role (run this part)
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Find the user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@sewanee.edu';
    
    IF admin_user_id IS NOT NULL THEN
        -- Insert or update admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'Admin role assigned to user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'User admin@sewanee.edu not found. Please create the user first.';
    END IF;
END $$;

-- Step 3: Verify the admin role was assigned
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@sewanee.edu';

-- Step 4: If user doesn't exist, create it manually (ALTERNATIVE METHOD)
-- Only run this if the user doesn't exist from Step 1
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@sewanee.edu',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Then assign admin role to the new user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@sewanee.edu'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
*/

-- INSTRUCTIONS:
-- 1. If Step 1 shows the user exists, just run Step 2 and 3
-- 2. If Step 1 shows no results, uncomment and run Step 4
-- 3. After running the script, try logging in again with admin@sewanee.edu / admin123
