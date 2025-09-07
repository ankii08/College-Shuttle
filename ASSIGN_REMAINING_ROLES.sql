-- ASSIGN ROLES TO REMAINING USERS
-- Run this to assign roles to users that currently have null roles

-- Option 1: Assign all null role users as students (safest default)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'student'
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role IS NULL
ON CONFLICT (user_id) DO UPDATE SET role = 'student';

-- Option 2: If you want to make specific users drivers or admins, use these instead:

-- Make dasa0@sewanee.edu a driver (if that's you):
-- UPDATE public.user_roles 
-- SET role = 'driver' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'dasa0@sewanee.edu');

-- Add driver info for dasa0@sewanee.edu if making them a driver:
-- INSERT INTO public.drivers (user_id, name, assigned_vehicle)
-- VALUES 
--     ((SELECT id FROM auth.users WHERE email = 'dasa0@sewanee.edu'), 'Driver Name', (SELECT id FROM public.vehicles WHERE label = 'SHUTTLE-02' LIMIT 1))
-- ON CONFLICT (user_id) DO UPDATE SET 
--     name = EXCLUDED.name,
--     assigned_vehicle = EXCLUDED.assigned_vehicle;

-- Verify all users now have roles
SELECT 
    u.email,
    COALESCE(ur.role, 'NO ROLE') as role,
    d.name as driver_name,
    v.label as assigned_vehicle
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id  
LEFT JOIN public.drivers d ON u.id = d.user_id
LEFT JOIN public.vehicles v ON d.assigned_vehicle = v.id
ORDER BY u.email;
