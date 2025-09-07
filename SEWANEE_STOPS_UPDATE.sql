-- SEWANEE SHUTTLE STOPS UPDATE
-- Replace mock stops with actual Sewanee campus stops

-- First, clear existing mock stops
DELETE FROM public.stops WHERE name IN ('Student Union', 'Library', 'Dining Hall', 'Dormitories', 'Academic Buildings', 'Parking Lot');

-- Insert actual Sewanee shuttle stops with exact coordinates in route order
INSERT INTO public.stops (id, name, lat, lng, sequence, route_id, created_at) VALUES
(gen_random_uuid(), 'Tennessee Williams Center', 35.195776, -85.925553, 1, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Tennessee Ave (Gorgas/Quintard)', 35.198034, -85.925880, 2, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Hodgson Hill', 35.205012, -85.928734, 3, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Biehl Commons', 35.204276, -85.921583, 4, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Fowler', 35.208403, -85.919421, 5, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'French House/Football Field', 35.210067, -85.921343, 6, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Woodlands', 35.214218, -85.920759, 7, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Running Knob Hollow/Crafting Guild', 35.215660, -85.919976, 8, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Tennis Court', 35.209791, -85.915856, 9, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Trezvant', 35.205454, -85.912764, 10, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Humphreys', 35.204853, -85.915393, 11, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Bishops Commons', 35.204989, -85.918198, 12, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Wellness Commons', 35.202691, -85.921138, 13, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now()),
(gen_random_uuid(), 'Sewanee Village (Regions Bank)', 35.195781, -85.917943, 14, (SELECT id FROM public.routes WHERE short_name = 'MAIN'), now())
ON CONFLICT DO NOTHING;

-- Grant permissions
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_stops" ON public.stops;
CREATE POLICY "public_read_stops" ON public.stops
FOR SELECT TO public
USING (true);

-- Verify the stops were created
SELECT 
    id,
    name,
    lat,
    lng,
    sequence,
    route_id,
    created_at
FROM public.stops 
ORDER BY sequence;

-- Count total stops
SELECT COUNT(*) as total_stops FROM public.stops;
