-- SIMPLE RLS POLICIES FOR SINGLE SHUTTLE SYSTEM
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Re-enable RLS on user_roles table with simple policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

-- 3. Simple policies - users can read their own roles, admins can manage all
CREATE POLICY "users_read_own_role" ON public.user_roles
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "admins_manage_all_roles" ON public.user_roles
    FOR ALL 
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

-- 4. Public read access for vehicle data (students need to see shuttles)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_vehicles" ON public.vehicles
    FOR SELECT 
    USING (true);

CREATE POLICY "admins_manage_vehicles" ON public.vehicles
    FOR ALL 
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

-- 5. Public read for routes and stops  
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_routes" ON public.routes
    FOR SELECT 
    USING (true);

ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_stops" ON public.stops
    FOR SELECT 
    USING (true);

-- 6. Vehicle positions - drivers can insert, everyone can read
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_positions" ON public.vehicle_positions
    FOR SELECT 
    USING (true);

CREATE POLICY "authenticated_insert_positions" ON public.vehicle_positions
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- 7. Vehicle_latest view should inherit permissions
ALTER TABLE public.vehicle_latest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_latest" ON public.vehicle_latest
    FOR SELECT 
    USING (true);

-- 8. Alerts table - admins manage, everyone reads
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_alerts" ON public.alerts
    FOR SELECT 
    USING (true);

CREATE POLICY "admins_manage_alerts" ON public.alerts
    FOR ALL 
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

-- 9. Test the admin function
SELECT public.is_admin_user() as am_i_admin;

-- 10. Verify admin user still exists
SELECT u.email, ur.role 
FROM auth.users u 
JOIN public.user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'admin@sewanee.edu';
