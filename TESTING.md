# Sewanee Shuttle System - End-to-End Testing Guide

## Test Environment Setup

### Prerequisites
- ✅ Supabase project configured with database migration
- ✅ Environment variables set in `.env` and `admin-dashboard/.env.local`
- ✅ Dependencies installed for both mobile app and admin dashboard
- ✅ At least one admin user created in Supabase Auth

### Test Data Requirements
- Admin user with role 'admin' in `user_roles` table
- Driver user(s) with role 'driver' and assigned vehicle
- Student user(s) with role 'student'
- Sample routes, vehicles, and stops (provided in migration)

## Testing Checklist

### 🏗️ Infrastructure Tests

#### Database Schema
- [ ] All tables created successfully
- [ ] PostGIS extension enabled
- [ ] Sample data inserted (routes, vehicles, stops)
- [ ] RLS policies applied correctly
- [ ] Triggers functioning (vehicle_latest updates)

#### Edge Function
- [ ] `/ingest` function deployed
- [ ] Accepts authenticated requests
- [ ] Validates driver permissions
- [ ] Processes GPS ping batches
- [ ] Updates vehicle_positions table

### 📱 Mobile App Tests

#### Authentication Flow
- [ ] User can sign up with email/password
- [ ] User can log in successfully
- [ ] User role detection works (student vs driver tabs)
- [ ] Session persistence across app restarts

#### Student App Features
- [ ] Map loads with correct Sewanee location
- [ ] Live vehicle positions display
- [ ] Real-time updates via Supabase Realtime
- [ ] Stop locations shown on map
- [ ] ETA calculations display
- [ ] Service alerts appear
- [ ] Pull-to-refresh functionality

#### Driver App Features
- [ ] Location permissions requested
- [ ] Background location tracking starts
- [ ] GPS pings queued offline
- [ ] Pings sent to edge function when online
- [ ] Connection status indicator works
- [ ] Start/stop shift functionality
- [ ] Vehicle assignment validation

### 🌐 Admin Dashboard Tests

#### Authentication & Authorization
- [ ] Admin login works
- [ ] Non-admin users blocked from dashboard
- [ ] Session management functional

#### Live Monitoring
- [ ] Live map shows vehicle positions
- [ ] Real-time position updates
- [ ] Vehicle list shows status
- [ ] Connection indicators work

#### Route Management
- [ ] View existing routes
- [ ] Add new routes
- [ ] Edit route properties (name, color)
- [ ] Add/edit stops for routes
- [ ] Delete routes/stops
- [ ] Route shape visualization

#### Driver Management
- [ ] View all drivers
- [ ] Assign vehicles to drivers
- [ ] Toggle driver active status
- [ ] Driver creation workflow

#### Alert Management
- [ ] Create service alerts
- [ ] Edit existing alerts
- [ ] Set alert expiration
- [ ] Alert type selection (info/warning/urgent)
- [ ] Deactivate alerts

### 🔄 Integration Tests

#### Real-time Data Flow
- [ ] Driver app → GPS ping → Edge function → Database → Admin dashboard
- [ ] Admin creates alert → Students see alert
- [ ] Vehicle position updates appear in student app immediately
- [ ] Route progress calculation works correctly

#### Offline Functionality
- [ ] Driver app queues pings when offline
- [ ] Pings sent when connection restored
- [ ] Student app gracefully handles connection loss
- [ ] Admin dashboard shows connection status

#### Multi-user Scenarios
- [ ] Multiple drivers tracking simultaneously
- [ ] Multiple students viewing live data
- [ ] Admin making changes while users active
- [ ] Concurrent database updates handled correctly

## Performance Tests

### Database Performance
- [ ] Large number of GPS pings (1000+)
- [ ] Multiple simultaneous connections
- [ ] Real-time subscription scaling
- [ ] Query performance with historical data

### Mobile App Performance
- [ ] Battery usage reasonable during tracking
- [ ] Memory usage stable during long sessions
- [ ] Map performance with multiple markers
- [ ] Offline queue size management

### Network Performance
- [ ] Efficient data transmission
- [ ] Graceful handling of slow connections
- [ ] Minimal data usage for students
- [ ] Edge function response times

## Security Tests

### Authentication Security
- [ ] JWT token validation
- [ ] Session timeout handling
- [ ] Password security requirements
- [ ] User role enforcement

### Authorization Security
- [ ] RLS policies prevent unauthorized access
- [ ] Drivers can't access other drivers' data
- [ ] Students can't modify data
- [ ] Admin-only functions protected

### Data Security
- [ ] GPS data encryption in transit
- [ ] No sensitive data in logs
- [ ] Proper error message handling
- [ ] API rate limiting (if implemented)

## User Experience Tests

### Ease of Use
- [ ] Intuitive navigation for all user types
- [ ] Clear error messages
- [ ] Helpful loading states
- [ ] Consistent design patterns

### Accessibility
- [ ] Screen reader compatibility
- [ ] Color contrast adequate
- [ ] Touch targets appropriately sized
- [ ] Keyboard navigation (web dashboard)

### Edge Cases
- [ ] No internet connection
- [ ] GPS unavailable
- [ ] No vehicles active
- [ ] No routes configured
- [ ] Database connection issues

## Deployment Tests

### Mobile App Deployment
- [ ] Expo development build works
- [ ] Production build successful
- [ ] App store compliance (if deploying)
- [ ] Push notification setup (if implemented)

### Web Dashboard Deployment
- [ ] Next.js build successful
- [ ] Static export works
- [ ] Environment variables configured
- [ ] Production performance acceptable

### Supabase Deployment
- [ ] Migration runs successfully
- [ ] Edge function deploys
- [ ] Environment variables set
- [ ] Database backups configured

## Testing Tools & Commands

### Run Setup Script
```bash
./setup-and-test.sh
```

### Start Development Environment
```bash
# Terminal 1 - Mobile app
npm run dev

# Terminal 2 - Admin dashboard
cd admin-dashboard && npm run dev

# Terminal 3 - Monitor logs (optional)
tail -f ~/.expo/logs/*.log
```

### Manual Testing URLs
- Mobile app: http://localhost:8081 (or Expo Go app)
- Admin dashboard: http://localhost:3001
- Supabase dashboard: https://app.supabase.com/project/[your-project]

### Test Data Queries
```sql
-- Check user roles
SELECT * FROM user_roles;

-- Check vehicle positions
SELECT * FROM vehicle_latest;

-- Check recent GPS pings
SELECT * FROM vehicle_positions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check alerts
SELECT * FROM alerts WHERE active = true;
```

## Success Criteria

### Minimum Viable Product (MVP)
- ✅ Students can see live shuttle locations
- ✅ Drivers can track and transmit location
- ✅ Admins can monitor fleet
- ✅ Basic alerts system functional
- ✅ System handles offline scenarios

### Full Feature Set
- ✅ Complete route/stop management
- ✅ Driver management interface
- ✅ Real-time ETA calculations
- ✅ Comprehensive alerting
- ✅ Analytics and reporting
- ✅ Mobile app store ready

## Troubleshooting Common Issues

### "Permission denied" for location
- Check app.json permissions configuration
- Ensure proper permission request in code
- Test on physical device (required for background location)

### "Invalid JWT" errors
- Verify Supabase environment variables
- Check token expiration handling
- Ensure proper authentication flow

### Real-time updates not working
- Check Supabase Realtime configuration
- Verify subscription setup
- Test WebSocket connection

### Database connection issues
- Verify Supabase URL and key
- Check RLS policies
- Test with Supabase dashboard

---

## Test Execution Log

**Date**: ___________  
**Tester**: ___________  
**Environment**: ___________  

**Overall Status**: [ ] Pass [ ] Fail [ ] Partial

**Notes**:
_____________________
_____________________
_____________________
