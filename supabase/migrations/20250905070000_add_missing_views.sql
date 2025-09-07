-- Add missing database views and functions for shuttle tracking

-- Create eta_to_stops view for arrival time estimates
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

-- Grant access to the view
GRANT SELECT ON eta_to_stops TO authenticated;

-- Create function to snap GPS coordinates to route
CREATE OR REPLACE FUNCTION snap_to_route(
  vehicle_lat double precision,
  vehicle_lng double precision,
  route_id_param uuid
)
RETURNS TABLE(
  snapped_lat double precision,
  snapped_lng double precision,
  route_progress double precision
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  route_geom geometry;
  vehicle_point geometry;
  snapped_point geometry;
  route_length double precision;
  progress_distance double precision;
BEGIN
  -- Get the route geometry
  SELECT s.geom INTO route_geom
  FROM shapes s
  WHERE s.route_id = route_id_param
  LIMIT 1;
  
  -- If no route geometry found, return original coordinates
  IF route_geom IS NULL THEN
    RETURN QUERY SELECT vehicle_lat, vehicle_lng, 0.0::double precision;
    RETURN;
  END IF;
  
  -- Create point from vehicle coordinates
  vehicle_point := ST_Point(vehicle_lng, vehicle_lat);
  
  -- Snap to the closest point on route
  snapped_point := ST_ClosestPoint(route_geom, vehicle_point);
  
  -- Calculate progress along route (0.0 to 1.0)
  route_length := ST_Length(route_geom::geography);
  progress_distance := ST_LineLocatePoint(route_geom, snapped_point) * route_length;
  
  RETURN QUERY SELECT 
    ST_Y(snapped_point)::double precision,
    ST_X(snapped_point)::double precision,
    CASE 
      WHEN route_length > 0 THEN (progress_distance / route_length)::double precision
      ELSE 0.0::double precision
    END;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION snap_to_route TO authenticated;

-- Create function to update vehicle_latest when positions are inserted
CREATE OR REPLACE FUNCTION update_vehicle_latest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vehicle_route_id uuid;
  snapped_coords RECORD;
BEGIN
  -- Get the vehicle's route ID
  SELECT v.route_id INTO vehicle_route_id
  FROM vehicles v
  WHERE v.id = NEW.vehicle_id;
  
  -- Snap coordinates to route if route exists
  IF vehicle_route_id IS NOT NULL THEN
    SELECT * INTO snapped_coords
    FROM snap_to_route(NEW.lat, NEW.lng, vehicle_route_id);
  ELSE
    -- No route snapping, use original coordinates
    snapped_coords.snapped_lat := NEW.lat;
    snapped_coords.snapped_lng := NEW.lng;
    snapped_coords.route_progress := 0.0;
  END IF;
  
  -- Update or insert into vehicle_latest
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
  ) VALUES (
    NEW.vehicle_id,
    NEW.lat,
    NEW.lng,
    snapped_coords.snapped_lat,
    snapped_coords.snapped_lng,
    snapped_coords.route_progress,
    NEW.timestamp,
    NEW.speed,
    NEW.heading,
    NEW.accuracy,
    NEW.battery,
    now()
  )
  ON CONFLICT (vehicle_id) DO UPDATE SET
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    snapped_lat = EXCLUDED.snapped_lat,
    snapped_lng = EXCLUDED.snapped_lng,
    route_progress = EXCLUDED.route_progress,
    timestamp = EXCLUDED.timestamp,
    speed = EXCLUDED.speed,
    heading = EXCLUDED.heading,
    accuracy = EXCLUDED.accuracy,
    battery = EXCLUDED.battery,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update vehicle_latest
DROP TRIGGER IF EXISTS update_vehicle_latest_trigger ON vehicle_positions;
CREATE TRIGGER update_vehicle_latest_trigger
  AFTER INSERT ON vehicle_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_latest();
