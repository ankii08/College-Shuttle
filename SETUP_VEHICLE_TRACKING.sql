-- SETUP VEHICLE TRACKING TABLES
-- Run this after the main shuttle setup

-- Create the vehicle_positions table (raw GPS pings from drivers)
CREATE TABLE IF NOT EXISTS public.vehicle_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    battery INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Drop existing vehicle_latest table if it exists
DROP TABLE IF EXISTS public.vehicle_latest CASCADE;

-- Create the vehicle_latest view (current positions for student map)
CREATE OR REPLACE VIEW public.vehicle_latest AS
SELECT DISTINCT ON (vehicle_id)
    vehicle_id,
    lat,
    lng,
    lat as snapped_lat,  -- For now, use same coordinates  
    lng as snapped_lng,
    timestamp,
    speed,
    battery
FROM public.vehicle_positions
ORDER BY vehicle_id, timestamp DESC;

-- Add RLS policies for security
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;

-- Allow drivers to insert positions for their assigned vehicle only
CREATE POLICY "Drivers can insert positions for their vehicle" ON public.vehicle_positions
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.drivers 
            WHERE user_id = auth.uid() 
            AND assigned_vehicle = vehicle_id
            AND active = true
        )
    );

-- Allow everyone to read vehicle positions (students need this for the map)
CREATE POLICY "Everyone can read vehicle positions" ON public.vehicle_positions
    FOR SELECT USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_vehicle_timestamp 
ON public.vehicle_positions(vehicle_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_positions_timestamp 
ON public.vehicle_positions(timestamp DESC);

-- Verify the setup
SELECT 
    v.label as vehicle,
    COUNT(vp.id) as position_count,
    MAX(vp.timestamp) as latest_ping
FROM public.vehicles v
LEFT JOIN public.vehicle_positions vp ON v.id = vp.vehicle_id
GROUP BY v.id, v.label
ORDER BY v.label;

-- Check the latest positions view
SELECT 
    vl.vehicle_id,
    v.label as vehicle_name,
    vl.lat,
    vl.lng,
    vl.timestamp,
    vl.speed
FROM public.vehicle_latest vl
JOIN public.vehicles v ON vl.vehicle_id = v.id;
