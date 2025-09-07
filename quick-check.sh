#!/bin/bash

# Simple Sewanee Shuttle System Test
echo "🚌 Sewanee Shuttle System - Quick Status Check"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "app.json" ]; then
    echo "❌ Not in Sewanee Shuttle directory"
    exit 1
fi

echo "✅ In correct project directory"

# Check key files
echo "📁 Checking project structure..."

KEY_FILES=(
    "package.json"
    "app.json"
    "supabase/migrations/20250905065815_bitter_harbor.sql"
    "supabase/functions/ingest/index.ts"
    "app/(tabs)/driver/index.tsx"
    "app/(tabs)/student/index.tsx"
    "admin-dashboard/package.json"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

echo ""
echo "🔧 Environment Setup:"

# Check environment files
if [ -f ".env" ]; then
    echo "  ✅ Mobile app .env exists"
else
    echo "  ⚠️  Mobile app .env missing (copy from .env.example)"
fi

if [ -f "admin-dashboard/.env.local" ]; then
    echo "  ✅ Admin dashboard .env.local exists"
else
    echo "  ⚠️  Admin dashboard .env.local missing (copy from .env.local.example)"
fi

echo ""
echo "📦 Dependencies:"
if [ -d "node_modules" ]; then
    echo "  ✅ Mobile app dependencies installed"
else
    echo "  ❌ Run: npm install"
fi

if [ -d "admin-dashboard/node_modules" ]; then
    echo "  ✅ Admin dashboard dependencies installed"
else
    echo "  ❌ Run: cd admin-dashboard && npm install"
fi

echo ""
echo "🚀 To start development:"
echo "  Terminal 1: npm run dev           (Mobile app)"
echo "  Terminal 2: cd admin-dashboard && npm run dev  (Admin dashboard)"
echo ""
echo "📋 Next steps:"
echo "  1. Configure Supabase environment variables"
echo "  2. Run database migration"
echo "  3. Create admin user"
echo "  4. Test with mobile device/simulator"
