-- Fix missing vehicle data
-- First, let's check what we have
SELECT 'Routes:' as info;
SELECT id, name, active FROM routes;

SELECT 'Vehicles:' as info;
SELECT * FROM vehicles;

-- Insert a vehicle if none exists
INSERT INTO vehicles (
  id,
  license_plate,
  capacity,
  active,
  current_route_id,
  created_at,
  updated_at
) 
SELECT 
  'vehicle-001',
  'SEWANEE-1',
  15,
  true,
  r.id,
  NOW(),
  NOW()
FROM routes r 
WHERE r.name = 'Campus Shuttle Route'
AND NOT EXISTS (SELECT 1 FROM vehicles WHERE id = 'vehicle-001');

-- Verify the insert
SELECT 'After insert:' as info;
SELECT v.id, v.license_plate, v.active, r.name as route_name 
FROM vehicles v 
LEFT JOIN routes r ON v.current_route_id = r.id;
