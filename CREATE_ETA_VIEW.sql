-- CREATE MISSING ETA_TO_STOPS VIEW
-- This creates a simplified version that works with your current setup

-- Simple eta_to_stops view that returns basic data
-- This prevents the error while you develop the full ETA functionality later
CREATE OR REPLACE VIEW eta_to_stops AS
SELECT 
  v.id as vehicle_id,
  v.label as vehicle_name,
  'Campus Center' as stop_name,
  NOW() + INTERVAL '5 minutes' as estimated_arrival,
  1.0 as distance_km
FROM vehicles v
WHERE v.active = true
UNION ALL
SELECT 
  v.id as vehicle_id,
  v.label as vehicle_name,
  'Library' as stop_name,
  NOW() + INTERVAL '10 minutes' as estimated_arrival,
  2.0 as distance_km
FROM vehicles v
WHERE v.active = true
UNION ALL
SELECT 
  v.id as vehicle_id,
  v.label as vehicle_name,
  'Dining Hall' as stop_name,
  NOW() + INTERVAL '15 minutes' as estimated_arrival,
  3.0 as distance_km
FROM vehicles v
WHERE v.active = true;

-- Grant permissions
GRANT SELECT ON eta_to_stops TO authenticated;
GRANT SELECT ON eta_to_stops TO anon;

-- Test the view
SELECT * FROM eta_to_stops LIMIT 5;
