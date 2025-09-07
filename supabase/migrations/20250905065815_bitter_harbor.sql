/*
# Initial Shuttle Tracking Schema

1. Core Tables
   - `routes` - Bus routes with colors and names
   - `shapes` - Route geometries as PostGIS LineStrings  
   - `stops` - Bus stops with locations and sequences
   - `vehicles` - Fleet vehicles with labels and assignments
   - `drivers` - Driver profiles with vehicle assignments
   - `vehicle_positions` - GPS ping history (append-only)
   - `vehicle_latest` - Current vehicle positions (materialized view)
   - `alerts` - Service alerts and notifications
   - `user_roles` - Role-based access control

2. Geospatial Features
   - PostGIS extension for geographic data types
   - Route snapping functions for GPS accuracy
   - Distance calculations for ETA estimates

3. Security
   - Row Level Security (RLS) enabled on all tables
   - Role-based policies for drivers, students, and admins
   - JWT-based authentication through Supabase Auth

4. Real-time Updates
   - Triggers to update materialized views
   - Realtime subscriptions for live tracking
*/

-- Enable PostGIS extension for geographic data types
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_name text NOT NULL,
  long_name text NOT NULL,
  color text NOT NULL DEFAULT '#4B0082',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- Create shapes table for route geometries
CREATE TABLE IF NOT EXISTS shapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  geom geometry(LineString, 4326) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shapes ENABLE ROW LEVEL SECURITY;

-- Create stops table
CREATE TABLE IF NOT EXISTS stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  sequence integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(route_id, sequence)
);

ALTER TABLE stops ENABLE ROW LEVEL SECURITY;

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text UNIQUE NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  assigned_vehicle uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create vehicle_positions table for GPS history
CREATE TABLE IF NOT EXISTS vehicle_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  timestamp timestamptz NOT NULL,
  speed double precision,
  heading double precision,
  accuracy double precision,
  battery double precision,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_positions ENABLE ROW LEVEL SECURITY;

-- Create vehicle_latest table for current positions
CREATE TABLE IF NOT EXISTS vehicle_latest (
  vehicle_id uuid PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  snapped_lat double precision NOT NULL,
  snapped_lng double precision NOT NULL,
  route_progress double precision DEFAULT 0,
  timestamp timestamptz NOT NULL,
  speed double precision,
  heading double precision,
  accuracy double precision,
  battery double precision,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_latest ENABLE ROW LEVEL SECURITY;

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'warning', 'urgent')) DEFAULT 'info',
  active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'driver', 'student')) NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_vehicle_timestamp ON vehicle_positions(vehicle_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_timestamp ON vehicle_positions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stops_route_sequence ON stops(route_id, sequence);
CREATE INDEX IF NOT EXISTS idx_shapes_route ON shapes(route_id);

-- Spatial indexes
CREATE INDEX IF NOT EXISTS idx_shapes_geom ON shapes USING GIST(geom);

-- Function to snap GPS coordinates to route and calculate progress
CREATE OR REPLACE FUNCTION snap_to_route(
  p_lat double precision,
  p_lng double precision,
  p_route_id uuid
)
RETURNS TABLE(snapped_lat double precision, snapped_lng double precision, progress double precision)
LANGUAGE plpgsql
AS $$
DECLARE
  route_geom geometry;
  point_geom geometry;
  snapped_point geometry;
  route_length double precision;
  point_distance double precision;
BEGIN
  -- Get route geometry
  SELECT geom INTO route_geom
  FROM shapes 
  WHERE route_id = p_route_id
  LIMIT 1;

  -- If no route found, return original coordinates
  IF route_geom IS NULL THEN
    RETURN QUERY SELECT p_lat, p_lng, 0.0::double precision;
    RETURN;
  END IF;

  -- Create point geometry
  point_geom := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);

  -- Snap to route
  snapped_point := ST_ClosestPoint(route_geom, point_geom);

  -- Calculate progress along route
  route_length := ST_Length(route_geom::geography);
  point_distance := ST_Length(ST_LineSubstring(route_geom, 0, ST_LineLocatePoint(route_geom, snapped_point))::geography);

  -- Return snapped coordinates and progress
  RETURN QUERY SELECT 
    ST_Y(snapped_point)::double precision,
    ST_X(snapped_point)::double precision,
    CASE 
      WHEN route_length > 0 THEN (point_distance / route_length)::double precision
      ELSE 0.0::double precision
    END;
END;
$$;

-- Function to update vehicle_latest table
CREATE OR REPLACE FUNCTION update_vehicle_latest()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  snapped_data record;
  vehicle_route_id uuid;
BEGIN
  -- Get vehicle's route
  SELECT route_id INTO vehicle_route_id
  FROM vehicles
  WHERE id = NEW.vehicle_id;

  -- Snap to route if route exists
  IF vehicle_route_id IS NOT NULL THEN
    SELECT * INTO snapped_data
    FROM snap_to_route(NEW.lat, NEW.lng, vehicle_route_id);
  ELSE
    -- No route, use original coordinates
    snapped_data.snapped_lat := NEW.lat;
    snapped_data.snapped_lng := NEW.lng;
    snapped_data.progress := 0.0;
  END IF;

  -- Insert or update vehicle_latest
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
    snapped_data.snapped_lat,
    snapped_data.snapped_lng,
    snapped_data.progress,
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
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_vehicle_latest ON vehicle_positions;
CREATE TRIGGER trigger_update_vehicle_latest
  AFTER INSERT ON vehicle_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_latest();

-- Create ETA view
CREATE OR REPLACE VIEW eta_to_stops AS
SELECT 
  vl.vehicle_id,
  s.id as stop_id,
  s.name as stop_name,
  -- Basic ETA calculation: current time + (distance / speed)
  -- Assuming average speed of 15 mph if no speed data
  (now() + INTERVAL '1 hour' * (
    ST_Distance(
      ST_SetSRID(ST_MakePoint(vl.snapped_lng, vl.snapped_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography
    ) / 1000 / COALESCE(vl.speed * 1.60934, 24.14) -- mph to km/h, default 15 mph
  )) as estimated_arrival,
  ST_Distance(
    ST_SetSRID(ST_MakePoint(vl.snapped_lng, vl.snapped_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography
  ) / 1000 as distance_km
FROM vehicle_latest vl
JOIN vehicles v ON v.id = vl.vehicle_id
JOIN stops s ON s.route_id = v.route_id
WHERE v.active = true
  AND vl.timestamp > now() - INTERVAL '5 minutes' -- Only recent positions
ORDER BY vl.vehicle_id, distance_km;

-- RLS Policies

-- Routes - readable by all authenticated users
CREATE POLICY "Routes are readable by authenticated users"
  ON routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage routes"
  ON routes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Shapes - readable by all authenticated users
CREATE POLICY "Shapes are readable by authenticated users"
  ON shapes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage shapes"
  ON shapes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Stops - readable by all authenticated users
CREATE POLICY "Stops are readable by authenticated users"
  ON stops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage stops"
  ON stops FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Vehicles - readable by all authenticated users
CREATE POLICY "Vehicles are readable by authenticated users"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Drivers - readable by all authenticated users, manageable by admins
CREATE POLICY "Drivers are readable by authenticated users"
  ON drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage drivers"
  ON drivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Vehicle positions - drivers can insert for their vehicle, readable by admins
CREATE POLICY "Drivers can insert positions for their assigned vehicle"
  ON vehicle_positions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM drivers d
      JOIN vehicles v ON v.id = d.assigned_vehicle
      WHERE d.user_id = auth.uid() AND v.id = vehicle_id AND d.active = true
    )
  );

CREATE POLICY "Admins can read all vehicle positions"
  ON vehicle_positions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Vehicle latest - readable by all authenticated users
CREATE POLICY "Vehicle latest positions are readable by authenticated users"
  ON vehicle_latest FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage vehicle latest"
  ON vehicle_latest FOR ALL
  TO authenticated
  USING (true);

-- Alerts - readable by all authenticated users, manageable by admins
CREATE POLICY "Alerts are readable by authenticated users"
  ON alerts FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage alerts"
  ON alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- User roles - users can read their own role, admins can manage all roles
CREATE POLICY "Users can read their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default admin user role (you'll need to replace this UUID with actual user ID)
-- CREATE USER FIRST through Supabase Auth, then run:
-- INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_UUID_HERE', 'admin');

-- Insert sample data for testing
INSERT INTO routes (id, short_name, long_name, color) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'CAMPUS', 'Campus Shuttle Route', '#4B0082'),
  ('550e8400-e29b-41d4-a716-446655440002', 'TOWN', 'Downtown Shuttle Route', '#059669');

INSERT INTO vehicles (id, label, route_id) VALUES 
  ('550e8400-e29b-41d4-a716-446655440011', 'SHUTTLE-01', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440012', 'SHUTTLE-02', '550e8400-e29b-41d4-a716-446655440001');

-- Sample stops for Sewanee campus
INSERT INTO stops (route_id, name, lat, lng, sequence) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'All Saints Chapel', 35.2045, -85.9209, 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'Student Union', 35.2055, -85.9195, 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'Library', 35.2035, -85.9225, 3),
  ('550e8400-e29b-41d4-a716-446655440001', 'Athletic Center', 35.2065, -85.9185, 4),
  ('550e8400-e29b-41d4-a716-446655440001', 'Residential Quad', 35.2025, -85.9235, 5);

-- Sample route shape (simple loop around campus)
INSERT INTO shapes (route_id, geom) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  ST_GeomFromText('LINESTRING(-85.9209 35.2045, -85.9195 35.2055, -85.9225 35.2035, -85.9185 35.2065, -85.9235 35.2025, -85.9209 35.2045)', 4326)
);