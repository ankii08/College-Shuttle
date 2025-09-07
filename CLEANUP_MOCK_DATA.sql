-- CLEAN UP MOCK SHUTTLE DATA
-- Run this to remove test/mock data and keep only real GPS tracking data

-- First, let's see what data we have
SELECT 
    v.label as vehicle_name,
    COUNT(vp.id) as position_count,
    MIN(vp.timestamp) as first_ping,
    MAX(vp.timestamp) as latest_ping,
    MIN(vp.lat) as min_lat,
    MAX(vp.lat) as max_lat,
    MIN(vp.lng) as min_lng,
    MAX(vp.lng) as max_lng
FROM public.vehicles v
LEFT JOIN public.vehicle_positions vp ON v.id = vp.vehicle_id
GROUP BY v.id, v.label
ORDER BY v.label;

-- Remove old/mock vehicle position data (keep data from today only)
DELETE FROM public.vehicle_positions 
WHERE created_at < CURRENT_DATE;

-- Or if you want to remove ALL old data and start fresh:
-- DELETE FROM public.vehicle_positions;

-- Check what's left - show latest position for each vehicle
SELECT DISTINCT ON (v.label)
    v.label as vehicle_name,
    COUNT(vp.id) OVER (PARTITION BY v.id) as position_count,
    vp.timestamp as latest_ping,
    vp.lat,
    vp.lng
FROM public.vehicles v
LEFT JOIN public.vehicle_positions vp ON v.id = vp.vehicle_id
ORDER BY v.label, vp.timestamp DESC NULLS LAST;
