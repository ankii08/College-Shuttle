# 🚌 Sewanee Shuttle - Production Ready

A simple, reliable shuttle tracking system for campus transportation.

## 📱 **What This System Does**

- **Students**: See shuttle location in real-time, know when it's coming
- **Drivers**: Share GPS location while driving the shuttle
- **Admins**: Monitor shuttle, send alerts, manage system

## 🚀 **Quick Production Deployment**

### 1. **Database Setup** (5 minutes)
```bash
# In your Supabase Dashboard > SQL Editor:
1. Run SIMPLE_RLS_PRODUCTION.sql      # Sets up security
2. Run SETUP_SINGLE_SHUTTLE.sql       # Creates your shuttle route
3. Update coordinates in step 2 for your campus stops
```

### 2. **Environment Setup** (3 minutes)
```bash
# Copy and fill in your Supabase credentials:
cp .env.production .env
cp admin-dashboard/.env.production admin-dashboard/.env.local

# Edit both files with your Supabase project URL and keys
```

### 3. **Deploy** (10 minutes)
```bash
# Run the production deployment script:
./deploy-production.sh

# Follow the prompts for your preferred deployment method
```

## 🎯 **System Specifications**

- **Single shuttle** running in a loop
- **Up to 1500 users** supported
- **6 campus stops** (customizable)
- **Real-time GPS tracking** (5-second updates)
- **Basic admin dashboard** for monitoring
- **Simple, reliable architecture**

## 📊 **Admin Dashboard Features**

- **Live Map**: See shuttle location in real-time
- **Vehicle Status**: Battery, speed, connection status
- **Service Alerts**: Send notifications to all students
- **Basic Analytics**: Usage statistics

## 📱 **Student App Features**

- **Real-time Map**: Current shuttle location
- **Stop List**: All campus stops in order
- **Service Alerts**: Important announcements
- **Simple Interface**: Easy to use, fast loading

## 👨‍💼 **Driver App Features**

- **GPS Sharing**: Automatic location updates
- **Background Tracking**: Works when app is closed
- **Simple Controls**: Start/stop tracking easily

## 🔧 **Technical Stack**

- **Mobile**: React Native (Expo)
- **Admin**: Next.js web app
- **Database**: Supabase (PostgreSQL + Auth)
- **Maps**: Native maps (iOS/Android)
- **Real-time**: WebSocket subscriptions

## 📞 **Support & Maintenance**

### Common Issues:
1. **Shuttle not showing**: Check driver app is running and tracking
2. **Location outdated**: Check internet connection
3. **App crashes**: Restart app, contact admin if persists

### Admin Tasks:
- **Daily**: Check shuttle is tracking properly
- **Weekly**: Review any error reports
- **Monthly**: Check system usage stats

### Emergency Contacts:
- **Technical Issues**: [Your IT contact]
- **Shuttle Operations**: [Transportation department]

## 🎉 **Go Live Checklist**

- [ ] Database security enabled (RLS policies)
- [ ] Shuttle route and stops configured
- [ ] Admin account created and tested
- [ ] Driver app installed and tested
- [ ] Student apps deployed (App Store/Play Store or web)
- [ ] Admin dashboard deployed and accessible
- [ ] Emergency contact information updated
- [ ] Staff trained on basic troubleshooting

## 🔒 **Security & Privacy**

- All data encrypted in transit and at rest
- Location data only stored while shuttle is active
- Admin access protected with role-based authentication
- No personal data collection from students
- GDPR/CCPA compliant architecture

---

**Ready to launch!** 🚀 Your simple, reliable shuttle tracking system for Sewanee University.
