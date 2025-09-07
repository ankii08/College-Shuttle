#!/bin/bash
# QUICK SYSTEM TEST

echo "🧪 Testing Sewanee Shuttle System"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}📋 System Test Checklist:${NC}"

# Test 1: Check if both servers are running
echo ""
echo "1. Testing servers..."

# Check mobile app server (port 8081 or 19000+)
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Mobile app server running${NC}"
elif curl -s http://localhost:19000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Mobile app server running (Expo)${NC}"
else
    echo -e "${RED}❌ Mobile app server not running${NC}"
    echo "   Run: npm run dev"
fi

# Check admin dashboard (port 3001)
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin dashboard running${NC}"
else
    echo -e "${RED}❌ Admin dashboard not running${NC}"
    echo "   Run: cd admin-dashboard && npm run dev"
fi

# Test 2: Check environment files
echo ""
echo "2. Testing environment configuration..."

if [ -f ".env" ]; then
    if grep -q "your_production" .env; then
        echo -e "${YELLOW}⚠️  Mobile app .env needs Supabase credentials${NC}"
    else
        echo -e "${GREEN}✅ Mobile app .env configured${NC}"
    fi
else
    echo -e "${RED}❌ Missing mobile app .env file${NC}"
    echo "   Run: cp .env.production .env"
fi

if [ -f "admin-dashboard/.env.local" ]; then
    if grep -q "your_production" admin-dashboard/.env.local; then
        echo -e "${YELLOW}⚠️  Admin dashboard .env needs Supabase credentials${NC}"
    else
        echo -e "${GREEN}✅ Admin dashboard .env configured${NC}"
    fi
else
    echo -e "${RED}❌ Missing admin dashboard .env file${NC}"
    echo "   Run: cp admin-dashboard/.env.production admin-dashboard/.env.local"
fi

# Test 3: Instructions for manual testing
echo ""
echo -e "${YELLOW}3. Manual Testing Required:${NC}"
echo ""
echo -e "${GREEN}Admin Dashboard Test:${NC}"
echo "   • Go to: http://localhost:3001"
echo "   • Login with: admin@sewanee.edu"
echo "   • Verify: Can see map with shuttle route and stops"
echo ""
echo -e "${GREEN}Mobile App Test (Student View):${NC}"
echo "   • Go to: http://localhost:8081 (or scan QR with Expo Go)"
echo "   • Tap: Student tab"
echo "   • Verify: Can see map with shuttle stops"
echo ""
echo -e "${GREEN}Mobile App Test (Driver View):${NC}"
echo "   • Tap: Driver tab"
echo "   • Verify: Can see location controls"
echo "   • Note: GPS sharing will only work on real device/simulator"

echo ""
echo -e "${YELLOW}🚀 Next Steps After Testing:${NC}"
echo "   1. If tests pass → Ready for production deployment!"
echo "   2. Run: ./deploy-production.sh"
echo "   3. Choose your deployment method (Vercel/Netlify for admin, EAS for mobile)"

echo ""
echo -e "${GREEN}🎉 System Status: Ready for Testing!${NC}"
