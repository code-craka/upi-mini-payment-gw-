# UPI Mini Gateway v2.0 Deployment Guide

**Version**: 2.0.0
**Author**: Sayem Abdullah Rihan (@code-craka)
**Last Updated**: September 23, 2024
**Migration Type**: 2-Role → 3-Role Hierarchy Upgrade

---

## 🎯 Overview

This guide provides step-by-step instructions for upgrading UPI Mini Gateway from v1.x (2-role system) to v2.0 (3-role hierarchy with merchant-user relationships).

### **What's New in v2.0**

- **3-Role Hierarchy**: `superadmin` → `merchant` → `user`
- **Data Isolation**: Complete segregation between merchant accounts
- **Enhanced RBAC**: Granular permissions and privilege escalation prevention
- **Audit Trails**: Comprehensive tracking for compliance
- **Merchant Management**: Parent-child relationships for user organization

---

## ⚠️ Pre-Migration Requirements

### **System Requirements**

- **Node.js**: 18.0.0 or higher
- **MongoDB**: 4.4 or higher
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: Additional 50% of current database size for migration
- **Network**: Stable connection to MongoDB Atlas

### **Environment Preparation**

1. **Backup Current Database**
   ```bash
   # Create complete backup
   mongodump --uri="YOUR_CURRENT_MONGO_URI" --out=./backup-pre-v2-$(date +%Y%m%d)

   # Verify backup integrity
   ls -la ./backup-pre-v2-$(date +%Y%m%d)
   ```

2. **Download Migration Script**
   ```bash
   # Ensure you have the migration script
   ls -la scripts/migrate-to-v2.js
   ```

3. **Environment Variables Check**
   ```bash
   # Verify all required environment variables
   cat .env.local | grep -E "(MONGO_URI|JWT_SECRET|NODE_ENV)"
   ```

---

## 🚀 Migration Strategy

### **Migration Approach**

1. **Zero-Downtime Migration**: Database changes during low-traffic period
2. **Rollback-Ready**: Complete rollback procedures in case of issues
3. **Data Integrity**: Comprehensive validation before and after migration
4. **Progressive Deployment**: Backend first, then frontend if needed

### **Migration Timeline**

- **Preparation**: 30 minutes
- **Database Migration**: 5-15 minutes (depending on data size)
- **Validation**: 10 minutes
- **Deployment**: 5 minutes
- **Total Estimated Time**: 50-60 minutes

---

## 📋 Step-by-Step Migration Process

### **Phase 1: Pre-Migration Preparation**

#### **Step 1.1: Environment Setup**
```bash
# 1. Navigate to backend directory
cd /path/to/UPI_MINI_GATEWAY/backend

# 2. Install dependencies (if not already done)
npm install

# 3. Build the application
npm run build

# 4. Verify environment
node -e "
const { config } = require('dotenv');
config({ path: '.env.local' });
console.log('✅ Environment loaded');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Configured' : '❌ Missing');
console.log('JWT Secret:', process.env.JWT_SECRET ? 'Configured' : '❌ Missing');
"
```

#### **Step 1.2: Database Backup**
```bash
# Create timestamped backup
BACKUP_DIR="backup-pre-v2-$(date +%Y%m%d-%H%M%S)"
mongodump --uri="YOUR_MONGO_URI" --out=./$BACKUP_DIR

# Verify backup
echo "Backup created in: $BACKUP_DIR"
ls -la $BACKUP_DIR
```

#### **Step 1.3: Data Validation (Pre-Migration)**
```bash
# Run pre-migration validation
node scripts/migrate-to-v2.js --dry-run --validate

# Expected output:
# ✅ Pre-migration validation completed
# 📊 Found X users to migrate
# 📊 Found Y orders to update
# 🔍 No data integrity issues found
```

### **Phase 2: Database Migration**

#### **Step 2.1: Execute Migration (Dry Run First)**
```bash
# Test migration without making changes
node scripts/migrate-to-v2.js --dry-run

# Expected output:
# 🔄 DRY RUN: Starting migration simulation...
# ✅ Would migrate 15 admin users to superadmin
# ✅ Would update 1,250 orders with merchant references
# ✅ Would create 8 new compound indexes
# 🎉 DRY RUN: Migration simulation completed successfully
```

#### **Step 2.2: Execute Actual Migration**
```bash
# Run the actual migration
node scripts/migrate-to-v2.js

# Monitor output carefully:
# 🔄 Starting UPI Gateway v2.0 migration...
# ✅ Connected to database
# 🔄 Migrating admin users to superadmin...
# ✅ Migrated 15 admin users successfully
# 🔄 Updating order merchant references...
# ✅ Updated 1,250 orders successfully
# 🔄 Creating database indexes...
# ✅ Created 8 new indexes successfully
# 🎉 Migration completed successfully in 12.3 seconds
```

#### **Step 2.3: Post-Migration Validation**
```bash
# Validate migration results
node scripts/migrate-to-v2.js --validate-only

# Expected output:
# ✅ Post-migration validation completed
# ✅ All user roles properly assigned
# ✅ All orders have correct merchant references
# ✅ Database indexes created successfully
# ✅ Data integrity verified
```

### **Phase 3: Application Deployment**

#### **Step 3.1: Deploy Backend Changes**
```bash
# 1. Build with latest changes
npm run build

# 2. Test server startup
npm run start

# Expected output:
# 🚀 Server running on port 3000
# 📊 Sentry enabled: true
# ✅ Mongo connected
```

#### **Step 3.2: Verify API Endpoints**
```bash
# Test health check
curl https://api.loanpaymentsystem.xyz/

# Test authentication with existing credentials
curl -X POST https://api.loanpaymentsystem.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_admin_username","password":"your_password"}'

# Response should include:
# "role": "superadmin" (previously "admin")
```

#### **Step 3.3: Test New RBAC Features**
```bash
# Create a test merchant user (as superadmin)
curl -X POST https://api.loanpaymentsystem.xyz/api/users \
  -H "Authorization: Bearer SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_merchant","password":"secure_password","role":"merchant"}'

# Login as merchant and create a user
curl -X POST https://api.loanpaymentsystem.xyz/api/users \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"secure_password","role":"user"}'
```

### **Phase 4: Verification & Monitoring**

#### **Step 4.1: Functional Testing**
```bash
# Test data isolation (merchant should only see their users)
curl -X GET https://api.loanpaymentsystem.xyz/api/users \
  -H "Authorization: Bearer MERCHANT_TOKEN"

# Test order creation and filtering
curl -X POST https://api.loanpaymentsystem.xyz/api/orders \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"vpa":"test@paytm","merchantName":"Test","expiresInSec":3600}'
```

#### **Step 4.2: Performance Monitoring**
```bash
# Check database performance
mongo YOUR_MONGO_URI --eval "
db.users.getIndexes().forEach(i => print(JSON.stringify(i)));
db.orders.getIndexes().forEach(i => print(JSON.stringify(i)));
"

# Monitor server metrics
curl https://api.loanpaymentsystem.xyz/api/debug/system-integrity \
  -H "Authorization: Bearer SUPERADMIN_TOKEN"
```

---

## 🔙 Rollback Procedures

### **When to Rollback**

- Migration script fails midway
- Data integrity issues discovered
- Application functionality broken
- Performance degradation

### **Emergency Rollback Steps**

#### **Step 1: Stop Application**
```bash
# Stop the running application
pkill -f "node.*server.js"
```

#### **Step 2: Restore Database**
```bash
# Drop current database (CAREFUL!)
mongo YOUR_MONGO_URI --eval "db.dropDatabase()"

# Restore from backup
mongorestore --uri="YOUR_MONGO_URI" ./backup-pre-v2-TIMESTAMP/
```

#### **Step 3: Deploy Previous Version**
```bash
# Checkout previous stable version
git checkout v1.x

# Rebuild and restart
npm run build
npm run start
```

#### **Step 4: Verify Rollback**
```bash
# Test login with previous admin credentials
curl -X POST https://api.loanpaymentsystem.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Role should be "admin" (not "superadmin")
```

---

## 🔍 Troubleshooting

### **Common Issues & Solutions**

#### **Issue 1: Migration Script Fails**
```bash
# Error: "Cannot find module"
npm install

# Error: "Connection refused"
# Check MongoDB URI in .env.local

# Error: "Insufficient permissions"
# Ensure database user has readWrite permissions
```

#### **Issue 2: Role Migration Issues**
```bash
# Check user roles after migration
mongo YOUR_MONGO_URI --eval "
db.users.find({}, {username: 1, role: 1}).forEach(printjson)
"

# Fix individual user role if needed
mongo YOUR_MONGO_URI --eval "
db.users.updateOne(
  {username: 'your_admin_username'},
  {\$set: {role: 'superadmin'}}
)
"
```

#### **Issue 3: Order Migration Issues**
```bash
# Check orders missing merchant reference
mongo YOUR_MONGO_URI --eval "
db.orders.find({merchant: {\$exists: false}}).count()
"

# Manual fix for orders (run migration script again)
node scripts/migrate-to-v2.js --fix-orders-only
```

#### **Issue 4: Index Creation Fails**
```bash
# Drop and recreate indexes manually
mongo YOUR_MONGO_URI --eval "
db.users.dropIndex({role: 1, isActive: 1});
db.users.createIndex({role: 1, isActive: 1});
db.users.createIndex({parent: 1, isActive: 1});
db.orders.createIndex({merchant: 1, status: 1, createdAt: -1});
"
```

---

## 📊 Validation Checklist

### **Pre-Migration Checklist**
- [ ] Database backup completed and verified
- [ ] Migration script tested in dry-run mode
- [ ] Environment variables configured
- [ ] Dependencies updated and built
- [ ] Maintenance window scheduled

### **Post-Migration Checklist**
- [ ] All users migrated successfully
- [ ] Orders have correct merchant references
- [ ] Database indexes created
- [ ] API endpoints responding correctly
- [ ] Authentication working with new roles
- [ ] Data isolation functioning properly
- [ ] Performance metrics normal
- [ ] Error monitoring active

### **RBAC Functionality Checklist**
- [ ] Superadmin can create merchants
- [ ] Merchants can create users
- [ ] Users cannot create other users
- [ ] Data filtering working correctly
- [ ] Permission validation working
- [ ] Audit trails being generated

---

## 🚨 Emergency Contacts

### **Support Team**
- **Primary**: Sayem Abdullah Rihan - hello@techsci.io
- **Repository**: https://github.com/code-craka/UPI_MINI_GATEWAY
- **Issues**: https://github.com/code-craka/UPI_MINI_GATEWAY/issues

### **Escalation Process**
1. **Level 1**: Check troubleshooting guide
2. **Level 2**: Execute rollback procedures
3. **Level 3**: Contact development team
4. **Level 4**: Emergency database restore

---

## 📚 Additional Resources

- **API Documentation**: `API_DOCUMENTATION_v2.md`
- **Migration Script**: `scripts/migrate-to-v2.js`
- **Test Plan**: `test-plan-rbac.md`
- **Changelog**: `CHANGELOG.md`
- **Security Policy**: `SECURITY.md`

---

## 📝 Post-Deployment Tasks

### **Immediate (0-24 hours)**
- [ ] Monitor error rates in Sentry
- [ ] Check database performance metrics
- [ ] Validate user feedback
- [ ] Monitor API response times

### **Short-term (1-7 days)**
- [ ] Gather user feedback on new features
- [ ] Monitor system stability
- [ ] Update documentation if needed
- [ ] Plan next iteration improvements

### **Long-term (1-4 weeks)**
- [ ] Performance optimization
- [ ] User training completion
- [ ] Feature usage analytics
- [ ] Version 2.1 planning

---

**© 2024 Sayem Abdullah Rihan - UPI Mini Gateway v2.0 Migration Guide**

*Last updated: September 23, 2024*