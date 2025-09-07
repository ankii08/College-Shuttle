-- SAFE RLS POLICIES - ONLY APPLIES TO EXISTING TABLES
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Re-enable RLS on user_roles table with simple policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on user_roles table';
    ELSE
        RAISE NOTICE 'Table user_roles does not exist, skipping';
    END IF;
END $$;

-- 2. Simple admin check function (no recursion)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 3. Create policies for user_roles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        -- Drop existing policies first
        DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
        DROP POLICY IF EXISTS "admins_manage_all_roles" ON public.user_roles;
        
        -- Create new policies
        CREATE POLICY "users_read_own_role" ON public.user_roles
            FOR SELECT 
            USING (user_id = auth.uid());

        CREATE POLICY "admins_manage_all_roles" ON public.user_roles
            FOR ALL 
            USING (public.is_admin_user())
            WITH CHECK (public.is_admin_user());
            
        RAISE NOTICE 'Created policies for user_roles table';
    END IF;
END $$;

-- 4. Vehicles table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles' AND table_schema = 'public') THEN
        ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public_read_vehicles" ON public.vehicles;
        DROP POLICY IF EXISTS "admins_manage_vehicles" ON public.vehicles;
        
        CREATE POLICY "public_read_vehicles" ON public.vehicles
            FOR SELECT 
            USING (true);

        CREATE POLICY "admins_manage_vehicles" ON public.vehicles
            FOR ALL 
            USING (public.is_admin_user())
            WITH CHECK (public.is_admin_user());
            
        RAISE NOTICE 'Created policies for vehicles table';
    END IF;
END $$;

-- 5. Routes table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes' AND table_schema = 'public') THEN
        ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public_read_routes" ON public.routes;
        
        CREATE POLICY "public_read_routes" ON public.routes
            FOR SELECT 
            USING (true);
            
        RAISE NOTICE 'Created policies for routes table';
    END IF;
END $$;

-- 6. Stops table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stops' AND table_schema = 'public') THEN
        ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public_read_stops" ON public.stops;
        
        CREATE POLICY "public_read_stops" ON public.stops
            FOR SELECT 
            USING (true);
            
        RAISE NOTICE 'Created policies for stops table';
    END IF;
END $$;

-- 7. Vehicle positions table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_positions' AND table_schema = 'public') THEN
        ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public_read_positions" ON public.vehicle_positions;
        DROP POLICY IF EXISTS "authenticated_insert_positions" ON public.vehicle_positions;
        
        CREATE POLICY "public_read_positions" ON public.vehicle_positions
            FOR SELECT 
            USING (true);

        CREATE POLICY "authenticated_insert_positions" ON public.vehicle_positions
            FOR INSERT 
            TO authenticated
            WITH CHECK (true);
            
        RAISE NOTICE 'Created policies for vehicle_positions table';
    END IF;
END $$;

-- 8. Vehicle_latest table/view policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_latest' AND table_schema = 'public') THEN
        ALTER TABLE public.vehicle_latest ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public_read_latest" ON public.vehicle_latest;
        
        CREATE POLICY "public_read_latest" ON public.vehicle_latest
            FOR SELECT 
            USING (true);
            
        RAISE NOTICE 'Created policies for vehicle_latest table';
    END IF;
END $$;

-- 9. Alerts table policies (not service_alerts)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts' AND table_schema = 'public') THEN
        ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public_read_alerts" ON public.alerts;
        DROP POLICY IF EXISTS "admins_manage_alerts" ON public.alerts;
        
        CREATE POLICY "public_read_alerts" ON public.alerts
            FOR SELECT 
            USING (true);

        CREATE POLICY "admins_manage_alerts" ON public.alerts
            FOR ALL 
            USING (public.is_admin_user())
            WITH CHECK (public.is_admin_user());
            
        RAISE NOTICE 'Created policies for alerts table';
    END IF;
END $$;

-- 10. Drivers table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers' AND table_schema = 'public') THEN
        ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "public_read_drivers" ON public.drivers;
        DROP POLICY IF EXISTS "admins_manage_drivers" ON public.drivers;
        
        CREATE POLICY "public_read_drivers" ON public.drivers
            FOR SELECT 
            USING (true);

        CREATE POLICY "admins_manage_drivers" ON public.drivers
            FOR ALL 
            USING (public.is_admin_user())
            WITH CHECK (public.is_admin_user());
            
        RAISE NOTICE 'Created policies for drivers table';
    END IF;
END $$;

-- 11. Test the admin function
SELECT public.is_admin_user() as am_i_admin;

-- 12. Verify admin user still exists
SELECT u.email, ur.role 
FROM auth.users u 
JOIN public.user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'admin@sewanee.edu';
