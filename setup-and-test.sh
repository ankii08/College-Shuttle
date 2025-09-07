#!/bin/bash

# Sewanee Shuttle System Setup Script
# This script sets up the development environment and tests the system

set -e  # Exit on any error

echo "🚌 Sewanee Shuttle System Setup & Test"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if required tools are installed
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
print_status "Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_status "npm found: $(npm --version)"

if ! command -v npx &> /dev/null; then
    print_error "npx is not installed. Please install npx first."
    exit 1
fi
print_status "npx found"

# Check for Expo CLI
if ! command -v expo &> /dev/null; then
    print_warning "Expo CLI not found globally. Installing..."
    npm install -g @expo/cli
fi
print_status "Expo CLI ready"

echo ""
echo "Setting up environment variables..."

# Check for environment files
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Created .env from .env.example"
        print_warning "Please edit .env with your Supabase credentials before proceeding"
        echo ""
        echo "You need to add:"
        echo "  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
        echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
        echo ""
        read -p "Press Enter when you've updated .env file..."
    else
        print_error ".env.example not found. Please create environment configuration."
        exit 1
    fi
else
    print_status "Main .env file exists"
fi

# Check admin dashboard environment
if [ ! -f "admin-dashboard/.env.local" ]; then
    if [ -f "admin-dashboard/.env.local.example" ]; then
        cp admin-dashboard/.env.local.example admin-dashboard/.env.local
        print_warning "Created admin-dashboard/.env.local from example"
        print_warning "Please edit admin-dashboard/.env.local with your Supabase credentials"
    else
        print_warning "Admin dashboard environment example not found"
    fi
else
    print_status "Admin dashboard .env.local exists"
fi

echo ""
echo "Installing dependencies..."

# Install main app dependencies
print_status "Installing mobile app dependencies..."
npm install

# Install admin dashboard dependencies
print_status "Installing admin dashboard dependencies..."
cd admin-dashboard
npm install
cd ..

echo ""
echo "Running system tests..."

# Test 1: Check package.json scripts
print_status "Testing package.json configuration..."
if npm run --silent lint &> /dev/null; then
    print_status "Lint script works"
else
    print_warning "Lint script failed (this might be normal for new projects)"
fi

# Test 2: Check Supabase connection (if environment is configured)
echo ""
print_status "Testing Supabase configuration..."
if [ -f ".env" ]; then
    # Extract Supabase URL from .env
    SUPABASE_URL=$(grep "EXPO_PUBLIC_SUPABASE_URL" .env | cut -d '=' -f2)
    if [ "$SUPABASE_URL" != "your_supabase_project_url_here" ] && [ ! -z "$SUPABASE_URL" ]; then
        # Test connection (basic curl test)
        if curl -s --head "$SUPABASE_URL/rest/v1/" | head -n 1 | grep -q "200 OK"; then
            print_status "Supabase connection successful"
        else
            print_warning "Supabase connection test failed"
        fi
    else
        print_warning "Supabase URL not configured in .env"
    fi
fi

# Test 3: Check TypeScript compilation
echo ""
print_status "Testing TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
    print_status "TypeScript compilation successful"
else
    print_warning "TypeScript compilation has warnings (check with 'npx tsc --noEmit')"
fi

# Test 4: Test admin dashboard build
echo ""
print_status "Testing admin dashboard..."
cd admin-dashboard
if npm run build > /dev/null 2>&1; then
    print_status "Admin dashboard builds successfully"
else
    print_warning "Admin dashboard build failed"
fi
cd ..

echo ""
echo "System Status Summary:"
echo "======================"

# Check critical files
CRITICAL_FILES=(
    "package.json"
    "app.json"
    "supabase/migrations/20250905065815_bitter_harbor.sql"
    "supabase/functions/ingest/index.ts"
    "app/(tabs)/driver/index.tsx"
    "app/(tabs)/student/index.tsx"
    "admin-dashboard/package.json"
    "admin-dashboard/components/Dashboard.tsx"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file missing"
    fi
done

echo ""
echo "Next Steps:"
echo "=========="
echo "1. 📱 Start mobile app: npm run dev"
echo "2. 🌐 Start admin dashboard: cd admin-dashboard && npm run dev"
echo "3. 🗄️ Deploy Supabase migration and edge function"
echo "4. 👤 Create admin user and assign role in Supabase"
echo "5. 🚗 Create driver accounts and assign vehicles"
echo ""
echo "For development:"
echo "  Mobile app will run on http://localhost:8081"
echo "  Admin dashboard on http://localhost:3001"
echo ""
print_status "Setup complete!"
