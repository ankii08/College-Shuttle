-- SETUP SINGLE SHUTTLE SYSTEM
-- Run this in Supabase Dashboard > SQL Editor after RLS setup

-- 1. Create the main shuttle route
INSERT INTO public.routes (id, short_name, long_name, color, active, created_at) 
VALUES (
    gen_random_uuid(),
    'MAIN',
    'Sewanee Campus Loop',
    '#4B0082',
    true,
    now()
) ON CONFLICT DO NOTHING;

-- 2. Create shuttle stops (adjust coordinates for your campus)
INSERT INTO public.stops (id, name, lat, lng, sequence, route_id, created_at) VALUES
(gen_random_uuid(), 'Student Union', 35.2040, -85.9234, 1, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Library', 35.2045, -85.9240, 2, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Dining Hall', 35.2050, -85.9245, 3, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Dormitories', 35.2055, -85.9250, 4, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Academic Buildings', 35.2060, -85.9255, 5, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Parking Lot', 35.2035, -85.9230, 6, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now())
ON CONFLICT DO NOTHING;

-- 3. Create your single shuttle vehicle
INSERT INTO public.vehicles (id, label, active, route_id, created_at) VALUES
(gen_random_uuid(), 'SHUTTLE-01', true, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now())
ON CONFLICT DO NOTHING;

-- 4. Create a driver account (you can create more later)
-- First create a user in Supabase Auth, then add driver record
-- INSERT INTO public.drivers (user_id, name, assigned_vehicle, active, created_at) VALUES
-- ('USER_ID_FROM_AUTH', 'Driver Name', (SELECT id FROM public.vehicles WHERE label = 'SHUTTLE-01'), true, now());

-- 5. Verify the setup
SELECT 
    r.short_name as route,
    v.label as vehicle,
    COUNT(s.id) as stop_count
FROM public.routes r
LEFT JOIN public.vehicles v ON r.id = v.route_id
LEFT JOIN public.stops s ON r.id = s.route_id
WHERE r.short_name = 'MAIN'
GROUP BY r.short_name, v.label;

-- 6. Show all stops in order
SELECT 
    s.sequence,
    s.name,
    s.lat,
    s.lng
FROM public.stops s
JOIN public.routes r ON s.route_id = r.id
WHERE r.short_name = 'MAIN'
ORDER BY s.sequence;
