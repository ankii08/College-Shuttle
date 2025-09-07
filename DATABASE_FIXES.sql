-- RUN THIS SCRIPT IN SUPABASE DASHBOARD > SQL EDITOR
-- This will add missing database views and functions

-- 1. Create eta_to_stops view for arrival time estimates
CREATE OR REPLACE VIEW eta_to_stops AS
WITH vehicle_distances AS (
  SELECT 
    vl.vehicle_id,
    s.id as stop_id,
    s.name as stop_name,
    s.lat as stop_lat,
    s.lng as stop_lng,
    vl.lat as vehicle_lat,
    vl.lng as vehicle_lng,
    vl.speed,
    vl.timestamp,
    -- Calculate distance in kilometers using PostGIS
    ST_Distance(
      ST_Point(vl.lng, vl.lat)::geography,
      ST_Point(s.lng, s.lat)::geography
    ) / 1000.0 as distance_km
  FROM vehicle_latest vl
  JOIN vehicles v ON vl.vehicle_id = v.id
  JOIN stops s ON v.route_id = s.route_id
  WHERE v.active = true
),
eta_calculations AS (
  SELECT 
    vehicle_id,
    stop_id,
    stop_name,
    distance_km,
    -- Estimate arrival time based on distance and speed
    -- If speed is null or too low, assume average speed of 15 km/h
    CASE 
      WHEN speed IS NULL OR speed < 5 THEN
        timestamp + (distance_km / 15.0) * INTERVAL '1 hour'
      ELSE
        timestamp + (distance_km / GREATEST(speed * 1.60934, 5)) * INTERVAL '1 hour'
    END as estimated_arrival
  FROM vehicle_distances
  WHERE distance_km < 10 -- Only show ETAs within 10km
)
SELECT 
  vehicle_id,
  stop_id,
  stop_name,
  estimated_arrival,
  distance_km
FROM eta_calculations
ORDER BY estimated_arrival;

-- 2. Grant access to the view
GRANT SELECT ON eta_to_stops TO authenticated;

-- 3. Create admin user (REPLACE EMAIL AND PASSWORD!)
-- First, create the user through Supabase Auth UI, then run this:
-- You'll need to replace 'ACTUAL_USER_UUID_HERE' with the real UUID from auth.users

-- Example (uncomment and modify):
-- INSERT INTO user_roles (user_id, role) 
-- SELECT id, 'admin'::user_role 
-- FROM auth.users 
-- WHERE email = 'admin@sewanee.edu';

-- 4. Alternative: Create admin user with SQL (if auth signup is disabled)
-- This creates both the auth user and role
/*
-- Generate password hash (replace 'your_password' with actual password)
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
);

-- Add admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'admin@sewanee.edu'
AND NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.users.id
);
*/

-- 5. Insert some test GPS data for demonstration
INSERT INTO vehicle_positions (vehicle_id, lat, lng, timestamp, speed, heading, accuracy) VALUES 
  ('550e8400-e29b-41d4-a716-446655440011', 35.2045, -85.9209, now() - INTERVAL '1 minute', 25.0, 90.0, 5.0),
  ('550e8400-e29b-41d4-a716-446655440011', 35.2050, -85.9200, now() - INTERVAL '30 seconds', 20.0, 95.0, 4.0),
  ('550e8400-e29b-41d4-a716-446655440012', 35.2035, -85.9225, now() - INTERVAL '2 minutes', 15.0, 180.0, 6.0);
