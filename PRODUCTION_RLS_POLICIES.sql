-- PRODUCTION RLS POLICIES - SECURE IMPLEMENTATION
-- Run this after testing is complete

-- 1. Re-enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create secure, non-recursive policies
-- Policy 1: Users can read their own roles
CREATE POLICY "users_read_own_role" ON public.user_roles
    FOR SELECT 
    USING (user_id = auth.uid());

-- Policy 2: Service role can manage all roles (for admin operations)
CREATE POLICY "service_role_all_access" ON public.user_roles
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Create admin verification function (server-side)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid 
        AND role = 'admin'
    );
END;
$$;

-- 4. Enable RLS on all sensitive tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;

-- 5. Create read-only policies for students
CREATE POLICY "students_read_vehicles" ON public.vehicles
    FOR SELECT 
    USING (true); -- All authenticated users can read vehicles

CREATE POLICY "students_read_routes" ON public.routes
    FOR SELECT 
    USING (true); -- All authenticated users can read routes

-- 6. Admin-only policies for management
CREATE POLICY "admins_manage_vehicles" ON public.vehicles
    FOR ALL 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Driver policies for location updates
CREATE POLICY "drivers_update_positions" ON public.vehicle_positions
    FOR INSERT
    USING (
        EXISTS (
            SELECT 1 FROM public.drivers d
            JOIN public.vehicles v ON d.vehicle_id = v.id
            WHERE d.user_id = auth.uid()
            AND v.label = NEW.vehicle_id
        )
    );
