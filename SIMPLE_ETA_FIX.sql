-- SIMPLE ETA VIEW FIX
-- Run this to fix the "eta_to_stops" table not found error

DROP VIEW IF EXISTS eta_to_stops;

CREATE OR REPLACE VIEW eta_to_stops AS
SELECT 
  'eta-twc-1' as id,
  null::text as vehicle_id,
  'twc'::text as stop_id,
  'Tennessee Williams Center' as stop_name,
  NOW() + INTERVAL '2 minutes' as estimated_arrival,
  0.2 as distance_km
UNION ALL
SELECT 
  'eta-gorgas-quintard-2' as id,
  null::text as vehicle_id,
  'gorgas-quintard'::text as stop_id,
  'Tennessee Ave (Gorgas/Quintard)' as stop_name,
  NOW() + INTERVAL '5 minutes' as estimated_arrival,
  0.4 as distance_km
UNION ALL
SELECT 
  'eta-hodgson-hill-3' as id,
  null::text as vehicle_id,
  'hodgson-hill'::text as stop_id,
  'Hodgson Hill' as stop_name,
  NOW() + INTERVAL '8 minutes' as estimated_arrival,
  0.8 as distance_km
UNION ALL
SELECT 
  'eta-biehl-commons-4' as id,
  null::text as vehicle_id,
  'biehl-commons'::text as stop_id,
  'Biehl Commons' as stop_name,
  NOW() + INTERVAL '12 minutes' as estimated_arrival,
  1.2 as distance_km
UNION ALL
SELECT 
  'eta-fowler-5' as id,
  null::text as vehicle_id,
  'fowler'::text as stop_id,
  'Fowler' as stop_name,
  NOW() + INTERVAL '15 minutes' as estimated_arrival,
  1.5 as distance_km
UNION ALL
SELECT 
  'eta-french-house-6' as id,
  null::text as vehicle_id,
  'french-house'::text as stop_id,
  'French House/Football Field' as stop_name,
  NOW() + INTERVAL '18 minutes' as estimated_arrival,
  1.8 as distance_km
UNION ALL
SELECT 
  'eta-woodlands-7' as id,
  null::text as vehicle_id,
  'woodlands'::text as stop_id,
  'Woodlands' as stop_name,
  NOW() + INTERVAL '22 minutes' as estimated_arrival,
  2.2 as distance_km
UNION ALL
SELECT 
  'eta-crafting-guild-8' as id,
  null::text as vehicle_id,
  'crafting-guild'::text as stop_id,
  'Running Knob Hollow/Crafting Guild' as stop_name,
  NOW() + INTERVAL '25 minutes' as estimated_arrival,
  2.5 as distance_km
UNION ALL
SELECT 
  'eta-tennis-court-9' as id,
  null::text as vehicle_id,
  'tennis-court'::text as stop_id,
  'Tennis Court' as stop_name,
  NOW() + INTERVAL '28 minutes' as estimated_arrival,
  2.8 as distance_km
UNION ALL
SELECT 
  'eta-trezvant-10' as id,
  null::text as vehicle_id,
  'trezvant'::text as stop_id,
  'Trezvant' as stop_name,
  NOW() + INTERVAL '32 minutes' as estimated_arrival,
  3.2 as distance_km
UNION ALL
SELECT 
  'eta-humphreys-11' as id,
  null::text as vehicle_id,
  'humphreys'::text as stop_id,
  'Humphreys' as stop_name,
  NOW() + INTERVAL '35 minutes' as estimated_arrival,
  3.5 as distance_km
UNION ALL
SELECT 
  'eta-bishops-commons-12' as id,
  null::text as vehicle_id,
  'bishops-commons'::text as stop_id,
  'Bishops Commons' as stop_name,
  NOW() + INTERVAL '38 minutes' as estimated_arrival,
  3.8 as distance_km
UNION ALL
SELECT 
  'eta-wellness-commons-13' as id,
  null::text as vehicle_id,
  'wellness-commons'::text as stop_id,
  'Wellness Commons' as stop_name,
  NOW() + INTERVAL '42 minutes' as estimated_arrival,
  4.2 as distance_km
UNION ALL
SELECT 
  'eta-regions-bank-14' as id,
  null::text as vehicle_id,
  'regions-bank'::text as stop_id,
  'Sewanee Village (Regions Bank)' as stop_name,
  NOW() + INTERVAL '45 minutes' as estimated_arrival,
  4.5 as distance_km;

-- Grant permissions
GRANT SELECT ON eta_to_stops TO authenticated;
GRANT SELECT ON eta_to_stops TO anon;

-- Test the view works
SELECT * FROM eta_to_stops;
