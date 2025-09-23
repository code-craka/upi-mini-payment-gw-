# UPI Mini Gateway v2.0 - Role-Based Access Control Test Plan

**Project**: UPI Mini Gateway v2.0
**Author**: Sayem Abdullah Rihan (@code-craka)
**Created**: December 23, 2024
**Version**: 2.0.0

## 📋 Overview

This comprehensive test plan verifies the role-based access control (RBAC) implementation for the upgraded UPI Mini Gateway system with the new 3-role hierarchy: `superadmin > merchant > user`.

## 🎯 Test Objectives

1. **Role Hierarchy Verification**: Ensure proper role-based permissions
2. **Data Isolation**: Verify merchants only see their data, users only see their own
3. **API Endpoint Security**: Test all endpoints with different role permissions
4. **Database Integrity**: Validate data relationships and constraints
5. **Backward Compatibility**: Ensure legacy functionality still works

## 👥 Test Roles & Data Setup

### Prerequisites

1. Run migration: `node backend/scripts/migrate-to-v2.js`
2. Create test users for each role
3. Generate test orders with different ownership patterns

### Test User Accounts

```javascript
// Test accounts to create
const testUsers = {
  superadmin: {
    username: "superadmin_test",
    password: "SuperAdmin123!",
    role: "superadmin"
  },
  merchant1: {
    username: "merchant_alpha",
    password: "Merchant123!",
    role: "merchant"
  },
  merchant2: {
    username: "merchant_beta",
    password: "Merchant123!",
    role: "merchant"
  },
  user1: {
    username: "user_alpha_1",
    password: "User123!",
    role: "user",
    parent: "merchant_alpha_id"
  },
  user2: {
    username: "user_alpha_2",
    password: "User123!",
    role: "user",
    parent: "merchant_alpha_id"
  },
  user3: {
    username: "user_beta_1",
    password: "User123!",
    role: "user",
    parent: "merchant_beta_id"
  }
};
```

## 🧪 Test Cases

### Category 1: Authentication & Authorization

#### TC-AUTH-001: Login Functionality

**Description**: Verify enhanced login response with role information
**Priority**: High
**Test Steps**:

1. Login with each test user
2. Verify response includes user data, role, permissions
3. Verify JWT token contains correct role information
4. Test token expiration (24h)

**Expected Results**:

- Login returns comprehensive user data
- JWT payload includes userId and role
- Token is valid for 24 hours
- Response includes permission flags

#### TC-AUTH-002: Token Validation

**Description**: Verify token validation endpoint
**Test Steps**:

1. Login and get token
2. Call `/api/auth/verify-token` with valid token
3. Call with expired/invalid token
4. Call without token

**Expected Results**:

- Valid token returns user info
- Invalid token returns 401
- Missing token returns 401

#### TC-AUTH-003: Profile Access

**Description**: Verify profile endpoint returns role-specific data
**Test Steps**:

1. Call `/api/auth/profile` as each role
2. Verify permission flags in response
3. Verify populated parent/createdBy fields

**Expected Results**:

- Each role gets appropriate permission flags
- User sees parent merchant info
- Merchant sees createdBy info

### Category 2: User Management

#### TC-USER-001: User Listing (Role-based Filtering)

**Description**: Verify users see only appropriate user lists
**Priority**: High
**Test Steps**:

1. **Superadmin**: GET `/api/users` → should see all users
2. **Merchant**: GET `/api/users` → should see self + their users only
3. **User**: GET `/api/users` → should see only themselves

**Expected Results**:
| Role | Can See |
|------|---------|
| Superadmin | All users (superadmins, merchants, users) |
| Merchant | Self + users with parent = merchant_id |
| User | Only themselves |

#### TC-USER-002: User Creation Permissions

**Description**: Verify role-based user creation restrictions
**Priority**: High
**Test Steps**:

1. **Superadmin**: Create merchant, user (with parentId)
2. **Merchant**: Create user (auto-assigned as parent)
3. **User**: Attempt to create any user (should fail)

**Expected Results**:

- Superadmin can create any role
- Merchant can only create users under themselves
- User cannot create any users
- Users must have merchant parent

#### TC-USER-003: User Update Permissions

**Description**: Verify users can only update permitted accounts
**Test Steps**:

1. Each role attempts to update various users
2. Test username updates
3. Test role changes (superadmin only)
4. Test isActive status changes

**Expected Results**:

- Users can only update themselves (limited fields)
- Merchants can update their assigned users
- Superadmin can update anyone
- Only superadmin can change roles

#### TC-USER-004: User Deletion (Soft Delete)

**Description**: Verify soft deletion permissions and functionality
**Test Steps**:

1. Each role attempts to delete various users
2. Verify user is soft-deleted (isActive = false)
3. Verify deleted users don't appear in listings
4. Verify deleted users cannot login

**Expected Results**:

- Only permitted roles can delete users
- Deletion is soft (isActive = false)
- Deleted users are hidden from normal queries
- Deleted users cannot authenticate

### Category 3: Order Management

#### TC-ORDER-001: Order Creation with Metadata

**Description**: Verify enhanced order creation with metadata tracking
**Priority**: High
**Test Steps**:

1. Create orders as each role
2. Verify metadata capture (IP, user agent, platform)
3. Verify merchant auto-assignment
4. Verify createdBy field population

**Expected Results**:

- Orders created with proper metadata
- Merchant field auto-populated based on user's parent
- createdBy field matches authenticated user
- All roles can create orders

#### TC-ORDER-002: Order Listing (Data Isolation)

**Description**: Verify role-based order filtering
**Priority**: High
**Test Steps**:

1. **Superadmin**: GET `/api/orders` → all orders
2. **Merchant**: GET `/api/orders` → only orders from their users
3. **User**: GET `/api/orders` → only their own orders

**Expected Results**:
| Role | Can See |
|------|---------|
| Superadmin | All orders across all merchants |
| Merchant | Orders where merchant = merchant_id |
| User | Orders where user = user_id |

#### TC-ORDER-003: Order Verification Permissions

**Description**: Verify role-based order verification
**Test Steps**:

1. Each role attempts to verify various orders
2. Test verification of orders from different merchants
3. Verify status transitions

**Expected Results**:

- Superadmin can verify any order
- Merchant can verify orders from their users only
- User cannot verify orders
- Only SUBMITTED orders can be verified

#### TC-ORDER-004: Superadmin Order Powers

**Description**: Verify superadmin-only order management features
**Priority**: High
**Test Steps**:

1. **Order Invalidation**: POST `/api/orders/:id/invalidate`
2. **Order Deletion**: DELETE `/api/orders/:id`
3. **Global Order View**: GET `/api/orders/all`

**Expected Results**:

- Only superadmin can invalidate orders
- Only superadmin can soft-delete orders
- Only superadmin can access global order view with stats
- Non-superadmin gets 403 Forbidden

### Category 4: Dashboard Analytics

#### TC-DASH-001: Role-based Dashboard Stats

**Description**: Verify dashboard returns appropriate data for each role
**Test Steps**:

1. **Superadmin**: GET `/api/dashboard/stats` → global stats
2. **Merchant**: GET `/api/dashboard/stats` → merchant-specific stats
3. **User**: GET `/api/dashboard/stats` → user-specific stats

**Expected Results**:
| Role | Dashboard Shows |
|------|----------------|
| Superadmin | Total users, merchants, orders, revenue across system |
| Merchant | Their users count, orders, revenue from their business |
| User | Their order count, total amount spent |

#### TC-DASH-002: Superadmin Analytics

**Description**: Verify advanced analytics endpoints
**Test Steps**:

1. GET `/api/dashboard/admin-stats` as superadmin
2. GET `/api/dashboard/revenue-trends` as superadmin
3. Attempt access as merchant/user (should fail)

**Expected Results**:

- Superadmin gets comprehensive analytics
- Non-superadmin gets 403 Forbidden
- Data includes merchant performance, trends, comparisons

### Category 5: Data Integrity & Relationships

#### TC-DATA-001: Parent-Child Relationships

**Description**: Verify user-merchant parent relationships
**Test Steps**:

1. Create user without parent (should fail)
2. Create user with invalid parent (should fail)
3. Create user with merchant parent (should succeed)
4. Verify parent relationship in database

**Expected Results**:

- Users must have merchant parent
- Parent validation prevents orphaned users
- Database maintains referential integrity

#### TC-DATA-002: Order-Merchant Assignment

**Description**: Verify automatic merchant assignment for orders
**Test Steps**:

1. User creates order → merchant should be user's parent
2. Merchant creates order → merchant should be themselves
3. Verify order.merchant field is populated correctly

**Expected Results**:

- Orders automatically assigned to correct merchant
- Database pre-save middleware works correctly
- No orphaned orders without merchant assignment

#### TC-DATA-003: Database Indexes Performance

**Description**: Verify database queries are optimized
**Test Steps**:

1. Check index usage in MongoDB
2. Run performance tests on filtered queries
3. Verify query execution times

**Expected Results**:

- Indexes are created and used effectively
- Role-based queries perform efficiently
- No full collection scans on large datasets

### Category 6: Security & Edge Cases

#### TC-SEC-001: Permission Escalation Prevention

**Description**: Verify users cannot escalate their permissions
**Test Steps**:

1. User attempts to access merchant/superadmin endpoints
2. Merchant attempts to access superadmin endpoints
3. Test with manipulated JWT tokens
4. Test with expired tokens

**Expected Results**:

- All unauthorized access returns 403 Forbidden
- Token manipulation is detected
- Expired tokens are rejected

#### TC-SEC-002: Data Leak Prevention

**Description**: Verify no data leaks across role boundaries
**Test Steps**:

1. Merchant A attempts to see Merchant B's data
2. User attempts to see other users' data
3. Test pagination and filtering for data leaks

**Expected Results**:

- Each role sees only permitted data
- No cross-merchant data leakage
- Pagination respects role-based filters

#### TC-SEC-003: Input Validation & Sanitization

**Description**: Verify all inputs are properly validated
**Test Steps**:

1. Test invalid role assignments
2. Test SQL injection in filters
3. Test XSS in user inputs
4. Test invalid ObjectIds

**Expected Results**:

- Invalid inputs are rejected with clear error messages
- No security vulnerabilities exploitable
- Proper error codes returned

### Category 7: Backward Compatibility

#### TC-COMPAT-001: Legacy Admin Role Support

**Description**: Verify legacy 'admin' role still works
**Test Steps**:

1. Use old admin middleware in routes
2. Verify admin maps to superadmin
3. Test existing admin functionality

**Expected Results**:

- Legacy admin middleware works
- Admin role treated as superadmin
- No breaking changes for existing code

#### TC-COMPAT-002: Existing API Endpoints

**Description**: Verify all existing endpoints still function
**Test Steps**:

1. Test original user management endpoints
2. Test original order endpoints
3. Test original dashboard endpoints

**Expected Results**:

- All existing endpoints work without modification
- Response formats remain compatible
- New fields added without breaking changes

## 🔧 Test Environment Setup

### 1. Database Preparation

```bash
# 1. Backup current database
mongodump --uri="YOUR_MONGO_URI" --out=./backup-pre-v2

# 2. Run migration in dry-run mode first
node backend/scripts/migrate-to-v2.js --dry-run

# 3. Run actual migration
node backend/scripts/migrate-to-v2.js

# 4. Verify migration results
```

### 2. Test Data Creation Script

```javascript
// Create test-data-setup.js
const setupTestData = async () => {
  // Create test users and orders
  // Populate with realistic data
  // Setup different scenarios
};
```

### 3. Environment Variables

```bash
# Test environment
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/upi_gateway_test
JWT_SECRET=test_secret_key_256_bits_minimum
```

## 📊 Test Execution

### Manual Testing Checklist

- [ ] Set up test environment
- [ ] Run migration script
- [ ] Create test user accounts
- [ ] Execute all test cases
- [ ] Document any failures
- [ ] Verify performance impact

### Automated Testing Script

```bash
# Run comprehensive test suite
npm run test:rbac

# Run specific test categories
npm run test:auth
npm run test:users
npm run test:orders
npm run test:dashboard
```

## 📈 Success Criteria

### Functional Requirements

- ✅ All role-based permissions work correctly
- ✅ Data isolation is properly enforced
- ✅ No unauthorized access is possible
- ✅ All new features function as designed

### Performance Requirements

- ✅ Query response times < 200ms for standard operations
- ✅ Database indexes provide efficient filtering
- ✅ No performance degradation from role checking

### Security Requirements

- ✅ No privilege escalation vulnerabilities
- ✅ No data leakage across role boundaries
- ✅ Proper error handling without information disclosure

### Compatibility Requirements

- ✅ All existing functionality preserved
- ✅ Frontend integration works without changes
- ✅ Migration is reversible if needed

## 🐛 Common Issues & Troubleshooting

### Issue 1: User Cannot Login After Migration

**Symptoms**: 401 Unauthorized on login
**Cause**: User not marked as active or role changed
**Solution**: Check `isActive` field and role in database

### Issue 2: Merchant Cannot See Their Users

**Symptoms**: Empty user list for merchant
**Cause**: Parent relationships not set correctly
**Solution**: Update user.parent field to point to merchant

### Issue 3: Orders Not Showing for Merchant

**Symptoms**: Empty order list for merchant
**Cause**: Order.merchant field not populated
**Solution**: Run order migration again or manually update

### Issue 4: Performance Issues with Large Datasets

**Symptoms**: Slow query responses
**Cause**: Missing or unused indexes
**Solution**: Verify indexes are created and being used

## 📝 Test Reporting

### Test Report Template

```markdown
# RBAC Test Execution Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Test/Staging/Production]

## Summary
- Total Test Cases: X
- Passed: X
- Failed: X
- Blocked: X
- Pass Rate: X%

## Failed Test Cases
[List failed tests with details]

## Performance Metrics
[Include response times, query performance]

## Recommendations
[Actions needed to resolve issues]
```

## ✅ Final Validation Checklist

Before declaring RBAC implementation complete:

- [ ] All test cases pass
- [ ] Performance meets requirements
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Frontend integration verified
- [ ] Production deployment plan ready
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured

---

**Note**: This test plan should be executed in a non-production environment first. Always backup your database before running any migration or testing procedures.