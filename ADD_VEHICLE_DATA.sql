-- Add vehicle data to complete the shuttle system setup
-- This script adds the missing vehicle that should appear in the admin dashboard

-- First, get the route ID for the campus route
DO $$
DECLARE
    campus_route_id uuid;
    shuttle_vehicle_id uuid;
BEGIN
    -- Get the campus route ID
    SELECT id INTO campus_route_id 
    FROM routes 
    WHERE short_name = 'CAMPUS' 
    LIMIT 1;
    
    IF campus_route_id IS NULL THEN
        RAISE EXCEPTION 'Campus route not found. Please run SETUP_SINGLE_SHUTTLE.sql first.';
    END IF;
    
    -- Insert the shuttle vehicle
    INSERT INTO vehicles (id, label, route_id, active, created_at)
    VALUES (
        gen_random_uuid(),
        'Shuttle 001',
        campus_route_id,
        true,
        NOW()
    )
    RETURNING id INTO shuttle_vehicle_id;
    
    -- Insert initial position for the vehicle (at first stop - Sewanee Campus Center)
    INSERT INTO vehicle_latest (
        vehicle_id,
        lat,
        lng,
        snapped_lat,
        snapped_lng,
        route_progress,
        timestamp,
        speed,
        heading,
        accuracy,
        battery,
        updated_at
    )
    VALUES (
        shuttle_vehicle_id,
        35.2042,  -- Campus Center coordinates
        -85.9217,
        35.2042,
        -85.9217,
        0.0,      -- Start of route
        NOW(),
        0.0,      -- Stationary
        0.0,      -- North
        10.0,     -- Good GPS accuracy
        85.0,     -- Good battery level
        NOW()
    );
    
    -- Also insert into vehicle_positions for history
    INSERT INTO vehicle_positions (
        vehicle_id,
        lat,
        lng,
        timestamp,
        speed,
        heading,
        accuracy,
        battery,
        created_at
    )
    VALUES (
        shuttle_vehicle_id,
        35.2042,
        -85.9217,
        NOW(),
        0.0,
        0.0,
        10.0,
        85.0,
        NOW()
    );
    
    RAISE NOTICE 'Successfully added vehicle: Shuttle 001 (ID: %)', shuttle_vehicle_id;
    RAISE NOTICE 'Vehicle is assigned to campus route and positioned at Campus Center';
    
END $$;

-- Verify the data was inserted
SELECT 
    v.label as vehicle_label,
    r.short_name as route,
    v.active as vehicle_active,
    vl.lat,
    vl.lng,
    vl.battery,
    vl.updated_at
FROM vehicles v
LEFT JOIN routes r ON v.route_id = r.id
LEFT JOIN vehicle_latest vl ON v.id = vl.vehicle_id
WHERE v.active = true;
