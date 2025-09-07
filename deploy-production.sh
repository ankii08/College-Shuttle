#!/bin/bash
# PRODUCTION DEPLOYMENT SCRIPT

echo "🚀 Preparing Sewanee Shuttle for Production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Production Readiness Checklist${NC}"

# 1. Check environment files
echo "1. Checking environment files..."
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Missing .env.production file${NC}"
    echo "   Copy .env.production template and fill in your values"
    exit 1
fi

if [ ! -f "admin-dashboard/.env.production" ]; then
    echo -e "${RED}❌ Missing admin-dashboard/.env.production file${NC}"
    echo "   Copy admin-dashboard/.env.production template and fill in your values"
    exit 1
fi
echo -e "${GREEN}✅ Environment files found${NC}"

# 2. Install dependencies
echo "2. Installing dependencies..."
npm install
cd admin-dashboard && npm install && cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"

# 3. Clean debug code (remove console.log statements)
echo "3. Cleaning debug code..."
# Remove console.log but keep console.error and console.warn
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .next | while read file; do
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' '/console\.log/d' "$file"
    else
        # Linux
        sed -i '/console\.log/d' "$file"
    fi
done
echo -e "${GREEN}✅ Debug code cleaned${NC}"

# 4. Build admin dashboard
echo "4. Building admin dashboard..."
cd admin-dashboard
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Admin dashboard built successfully${NC}"
else
    echo -e "${RED}❌ Admin dashboard build failed${NC}"
    exit 1
fi
cd ..

# 5. Check mobile app
echo "5. Checking mobile app..."
npx expo doctor
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Mobile app checks passed${NC}"
else
    echo -e "${YELLOW}⚠️ Mobile app has warnings (review expo doctor output)${NC}"
fi

# 6. Database setup reminder
echo ""
echo -e "${YELLOW}📊 DATABASE SETUP REQUIRED:${NC}"
echo "   1. Run SIMPLE_RLS_PRODUCTION.sql in your Supabase dashboard"
echo "   2. Run SETUP_SINGLE_SHUTTLE.sql to create your shuttle route"
echo "   3. Update coordinates in SETUP_SINGLE_SHUTTLE.sql for your campus"

# 7. Deployment options
echo ""
echo -e "${YELLOW}🚀 DEPLOYMENT OPTIONS:${NC}"
echo ""
echo -e "${GREEN}Mobile App (Choose one):${NC}"
echo "   • Development: expo start"
echo "   • Production Build: npx eas build --platform all"
echo "   • Web Version: expo export --platform web"
echo ""
echo -e "${GREEN}Admin Dashboard (Choose one):${NC}"
echo "   • Vercel: cd admin-dashboard && npx vercel --prod"
echo "   • Netlify: cd admin-dashboard && npx netlify deploy --prod --dir=.next"
echo "   • Self-hosted: cd admin-dashboard && npm start"

echo ""
echo -e "${GREEN}🎉 Production setup complete!${NC}"
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "   • Set up monitoring (Sentry recommended)"
echo "   • Configure backups in Supabase"
echo "   • Test with a small group first"
echo "   • Have admin contact info ready for support"
