# PRODUCTION ENVIRONMENT SETUP

## 1. SERVER-SIDE ENVIRONMENT VARIABLES
# admin-dashboard/.env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only
NODE_ENV=production

## 2. MOBILE APP ENVIRONMENT (EAS Build)
# .env.production
EXPO_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

## 3. SECURITY IMPROVEMENTS NEEDED:
- Move sensitive operations to server-side API routes
- Implement proper JWT validation
- Add API rate limiting
- Set up proper CORS policies
