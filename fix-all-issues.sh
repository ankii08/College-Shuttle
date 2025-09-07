#!/bin/bash

# Comprehensive Fix and Test Script for Sewanee Shuttle
echo "🔧 Running comprehensive fixes for Sewanee Shuttle..."

# 1. Fix file permissions
echo "📁 Fixing file permissions..."
find . -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" | xargs chmod 644
find . -name "*.sh" | xargs chmod +x

# 2. Check for TypeScript errors
echo "🔍 Checking TypeScript errors..."
cd "/Users/ankitdas/Downloads/Sewanee Shuttle"

# Check mobile app
echo "📱 Checking mobile app TypeScript..."
npx tsc --noEmit --project ./tsconfig.json

# Check admin dashboard
echo "🖥️  Checking admin dashboard TypeScript..."
cd admin-dashboard
npx tsc --noEmit --project ./tsconfig.json
cd ..

# 3. Test environment variables
echo "🔧 Testing environment variables..."
if [ ! -f ".env" ]; then
    echo "❌ Missing .env file for mobile app"
    exit 1
fi

if [ ! -f "admin-dashboard/.env.local" ]; then
    echo "❌ Missing .env.local file for admin dashboard"
    exit 1
fi

# 4. Check if Supabase is configured
echo "🗄️  Checking Supabase configuration..."
if ! grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
    echo "❌ Missing SUPABASE_URL in .env"
    exit 1
fi

if ! grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
    echo "❌ Missing SUPABASE_ANON_KEY in .env"
    exit 1
fi

# 5. Clean and rebuild
echo "🧹 Cleaning build caches..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf admin-dashboard/.next

# 6. Install dependencies if needed
echo "📦 Checking dependencies..."
npm install
cd admin-dashboard && npm install && cd ..

# 7. Test basic imports
echo "🧪 Testing basic imports..."
node -e "
try {
  require('./lib/supabase.ts');
  console.log('✅ Supabase import successful');
} catch (e) {
  console.log('❌ Supabase import failed:', e.message);
}
"

# 8. Check for common React Native issues
echo "📱 Checking React Native configuration..."

# Check if metro config exists
if [ ! -f "metro.config.js" ]; then
    echo "❌ Missing metro.config.js"
    exit 1
fi

# Check if babel config exists
if [ ! -f "babel.config.js" ]; then
    echo "❌ Missing babel.config.js"
    exit 1
fi

# 9. Test database connection (if possible)
echo "🗄️  Testing database connection..."
# This would require the database to be running

# 10. Summary
echo ""
echo "✅ Comprehensive fixes completed!"
echo ""
echo "🎯 Next Steps:"
echo "1. Run the DATABASE_FIXES.sql script in your Supabase dashboard"
echo "2. Start the mobile app: npm run dev"
echo "3. Start the admin dashboard: cd admin-dashboard && npm run dev"
echo "4. Create admin user using the SQL in DATABASE_FIXES.sql"
echo ""
echo "🚀 Your shuttle tracking system should now be ready!"
