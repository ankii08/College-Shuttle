#!/bin/bash

# Sewanee Shuttle Setup Script
echo "🚌 Setting up Sewanee Shuttle Tracking System..."

# Check if required tools are installed
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx is not installed. Please install npx first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Check for environment variables
echo "🔧 Checking environment configuration..."

if [[ ! -f ".env" ]]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        echo "📝 Please edit .env with your Supabase credentials before continuing."
        echo "   You can find these in your Supabase dashboard under Settings > API"
        read -p "Press Enter after you've updated the .env file..."
    else
        echo "❌ No .env.example file found. Please create a .env file manually."
        exit 1
    fi
fi

if [[ ! -f "admin-dashboard/.env.local" ]]; then
    echo "⚠️  No admin dashboard .env.local file found. Creating from template..."
    if [[ -f "admin-dashboard/.env.local.example" ]]; then
        cp admin-dashboard/.env.local.example admin-dashboard/.env.local
        echo "📝 Please edit admin-dashboard/.env.local with your Supabase credentials."
        read -p "Press Enter after you've updated the admin-dashboard/.env.local file..."
    else
        echo "❌ No admin-dashboard/.env.local.example file found."
        exit 1
    fi
fi

# Install mobile app dependencies
echo "📱 Installing mobile app dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install mobile app dependencies"
    exit 1
fi

# Install admin dashboard dependencies  
echo "🌐 Installing admin dashboard dependencies..."
cd admin-dashboard
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install admin dashboard dependencies"
    exit 1
fi
cd ..

# Check Expo CLI
if ! command -v expo &> /dev/null; then
    echo "📲 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Make sure your Supabase project is set up:"
echo "   - Create a Supabase project at https://supabase.com"
echo "   - Run the SQL migration in supabase/migrations/"
echo "   - Deploy the edge function in supabase/functions/ingest/"
echo "   - Create an admin user and add their role"
echo ""
echo "2. Start the development servers:"
echo "   Mobile app: npm run dev"
echo "   Admin dashboard: cd admin-dashboard && npm run dev"
echo ""
echo "3. Test the system:"
echo "   Run: ./test-system.sh"
echo ""

echo "📚 For detailed setup instructions, see the README.md file."
