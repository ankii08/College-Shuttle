#!/bin/bash

# Sewanee Shuttle System Testing Script
echo "🧪 Testing Sewanee Shuttle System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

echo "📋 Running system tests..."

# Test 1: Check environment files
echo "🔧 Testing environment configuration..."
if [[ -f ".env" ]] && [[ -f "admin-dashboard/.env.local" ]]; then
    test_result 0 "Environment files exist"
else
    test_result 1 "Environment files missing"
fi

# Test 2: Check dependencies
echo "📦 Testing dependencies..."
if npm list > /dev/null 2>&1; then
    test_result 0 "Mobile app dependencies installed"
else
    test_result 1 "Mobile app dependencies missing"
fi

cd admin-dashboard
if npm list > /dev/null 2>&1; then
    test_result 0 "Admin dashboard dependencies installed"
else
    test_result 1 "Admin dashboard dependencies missing"
fi
cd ..

# Test 3: Check key files
echo "📁 Testing project structure..."

key_files=(
    "supabase/migrations/20250905065815_bitter_harbor.sql"
    "supabase/functions/ingest/index.ts"
    "app/(tabs)/driver/index.tsx"
    "app/(tabs)/student/index.tsx"
    "admin-dashboard/app/page.tsx"
    "lib/supabase.ts"
    "types/database.ts"
)

for file in "${key_files[@]}"; do
    if [[ -f "$file" ]]; then
        test_result 0 "Found $file"
    else
        test_result 1 "Missing $file"
    fi
done

# Test 4: TypeScript compilation (mobile app)
echo "🔍 Testing TypeScript compilation..."
if npx tsc --noEmit > /dev/null 2>&1; then
    test_result 0 "Mobile app TypeScript compilation"
else
    test_result 1 "Mobile app TypeScript compilation - check for type errors"
fi

# Test 5: Next.js build check (admin dashboard)
echo "🏗️ Testing admin dashboard build..."
cd admin-dashboard
if npm run build > /dev/null 2>&1; then
    test_result 0 "Admin dashboard builds successfully"
else
    test_result 1 "Admin dashboard build failed"
fi
cd ..

# Test 6: Check Supabase configuration
echo "🗄️ Testing Supabase integration..."
if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env && grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
    if [[ $(grep "EXPO_PUBLIC_SUPABASE_URL=" .env | cut -d'=' -f2) != "your_supabase_project_url_here" ]]; then
        test_result 0 "Supabase configuration appears set up"
    else
        test_result 1 "Supabase configuration needs real credentials"
    fi
else
    test_result 1 "Supabase configuration missing"
fi

# Summary
echo ""
echo "📊 Test Summary:"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your system is ready.${NC}"
    echo ""
    echo "🚀 To start the system:"
    echo "1. Start mobile app: npm run dev"
    echo "2. Start admin dashboard: cd admin-dashboard && npm run dev"
    echo ""
    echo "📱 Mobile app will be available through Expo"
    echo "🌐 Admin dashboard will be available at http://localhost:3001"
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please fix the issues above before running the system.${NC}"
fi

echo ""
echo "🔗 Additional testing steps:"
echo "1. Set up your Supabase project and run the migration"
echo "2. Deploy the edge function"
echo "3. Create test users with appropriate roles"
echo "4. Test GPS tracking (requires physical device)"
echo "5. Test real-time updates between driver and student apps"
