-- FIX USER ROLES AND DRIVERS TABLE
-- Run this to fix the role errors and driver info errors

-- First, let's see what users exist
SELECT id, email FROM auth.users;

-- Check if user_roles table has data
SELECT * FROM public.user_roles;

-- Check if drivers table has data  
SELECT * FROM public.drivers;

-- Insert missing user roles (replace with actual user IDs from the first query)
-- Admin user: 88cfdcae-c6f3-4813-8245-874bbe82d592
-- Driver user: 67f4f2fe-e2e7-4ecc-bba2-4f0e7a6fc074

INSERT INTO public.user_roles (user_id, role) 
VALUES 
    ('88cfdcae-c6f3-4813-8245-874bbe82d592', 'admin'),
    ('67f4f2fe-e2e7-4ecc-bba2-4f0e7a6fc074', 'driver')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- Insert driver info for the driver user
INSERT INTO public.drivers (user_id, name, assigned_vehicle)
VALUES 
    ('67f4f2fe-e2e7-4ecc-bba2-4f0e7a6fc074', 'Test Driver', (SELECT id FROM public.vehicles WHERE label = 'SHUTTLE-01' LIMIT 1))
ON CONFLICT (user_id) DO UPDATE SET 
    name = EXCLUDED.name,
    assigned_vehicle = EXCLUDED.assigned_vehicle;

-- Verify the setup
SELECT 
    u.email,
    ur.role,
    d.name as driver_name,
    v.label as assigned_vehicle
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id  
LEFT JOIN public.drivers d ON u.id = d.user_id
LEFT JOIN public.vehicles v ON d.assigned_vehicle = v.id
ORDER BY u.email;
