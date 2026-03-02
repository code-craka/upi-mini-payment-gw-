# UPI Mini Gateway v2.0 RBAC Frontend Testing Checklist

**Testing Date**: September 23, 2024
**Backend Version**: v2.0 (3-Role Hierarchy)
**Frontend Testing**: Local Development Environment

---

## 🎯 Testing Overview

This checklist ensures the frontend UI properly handles the new 3-role hierarchy system:

- **superadmin** (was admin) - Global access
- **merchant** - Manages their users
- **user** - Self-management only

---

## 🔧 Setup for Testing

### **Backend Setup** ✅

- [x] v2.0 backend running on `http://localhost:3000`
- [x] Frontend configured to use `VITE_API_URL=http://localhost:3000`
- [x] Database connected with v2.0 RBAC schema

### **Test User Accounts Needed**

Create these test accounts for comprehensive testing:

```bash
# 1. Superadmin account (use existing admin or create new)
username: test_superadmin
password: test123
role: superadmin

# 2. Merchant account (to be created by superadmin)
username: test_merchant
password: test123
role: merchant

# 3. User account (to be created by merchant)
username: test_user
password: test123
role: user
parent: test_merchant
```

---

## 📋 Testing Scenarios

### **1. Authentication & Login Response**

#### **Test 1.1: Superadmin Login**

- [ ] Login with admin/superadmin credentials
- [ ] Verify role shows as "superadmin" (not "admin")
- [ ] Check response includes new fields:
  ```json
  {
    "user": {
      "role": "superadmin",
      "parent": null,
      "createdBy": "...",
      "createdAt": "..."
    }
  }
  ```

#### **Test 1.2: Role Display in UI**

- [ ] Navigation shows appropriate role-based menu items
- [ ] Dashboard title reflects user role
- [ ] User profile shows correct role badge

### **2. User Management Interface**

#### **Test 2.1: Superadmin User Management**

- [ ] Can see "Create User" button
- [ ] Can create both merchants and users
- [ ] User list shows all users across all merchants
- [ ] Can see user role badges (superadmin/merchant/user)
- [ ] Can see parent relationship (merchant → user)
- [ ] Search and filter functions work across all users

#### **Test 2.2: Merchant User Management**

- [ ] Login as merchant
- [ ] Can see "Create User" button (users only)
- [ ] Role dropdown only shows "user" option (not merchant/superadmin)
- [ ] User list shows only their own users + themselves
- [ ] Cannot see other merchants' users
- [ ] Created users automatically show merchant as parent

#### **Test 2.3: User Self-Management**

- [ ] Login as user
- [ ] Cannot see "Create User" button
- [ ] User list shows only their own profile
- [ ] Cannot access other user profiles
- [ ] Can update own profile information

### **3. Order Management**

#### **Test 3.1: Order Creation**

- [ ] Login as user and create an order
- [ ] Order automatically assigns merchant from user's parent
- [ ] Order shows proper creator and merchant information

#### **Test 3.2: Order Visibility - Superadmin**

- [ ] Login as superadmin
- [ ] Can see all orders from all merchants/users
- [ ] Order list shows merchant and user information
- [ ] Can invalidate orders (superadmin-only feature)

#### **Test 3.3: Order Visibility - Merchant**

- [ ] Login as merchant
- [ ] Can only see orders from their users
- [ ] Cannot see orders from other merchants
- [ ] Cannot invalidate orders

#### **Test 3.4: Order Visibility - User**

- [ ] Login as user
- [ ] Can only see their own orders
- [ ] Cannot see other users' orders

### **4. Dashboard Analytics**

#### **Test 4.1: Superadmin Dashboard**

- [ ] Shows global statistics (all users, merchants, orders)
- [ ] Analytics include data from all merchants
- [ ] Charts and graphs display comprehensive data

#### **Test 4.2: Merchant Dashboard**

- [ ] Shows only merchant-specific statistics
- [ ] User count shows only their users
- [ ] Order count shows only orders from their users
- [ ] Revenue shows only from their merchant account

#### **Test 4.3: User Dashboard**

- [ ] Shows only personal statistics
- [ ] Order count shows only their orders
- [ ] No merchant management options visible

### **5. Navigation & UI Elements**

#### **Test 5.1: Role-Based Navigation**

- [ ] Superadmin sees all menu items (users, orders, dashboard, analytics)
- [ ] Merchant sees user management and order views for their users
- [ ] User sees only personal dashboard and orders

#### **Test 5.2: Button Visibility**

- [ ] "Create User" button visible only to superadmin/merchant
- [ ] "Invalidate Order" button visible only to superadmin
- [ ] Role-specific action buttons properly hidden/shown

#### **Test 5.3: Data Filtering**

- [ ] Search results respect role-based data access
- [ ] Pagination works correctly with filtered data
- [ ] Export functions (if any) only export accessible data

### **6. Error Handling**

#### **Test 6.1: Permission Errors**

- [ ] Proper error messages for insufficient permissions
- [ ] UI gracefully handles 403 forbidden responses
- [ ] User redirected appropriately when accessing restricted areas

#### **Test 6.2: Data Validation**

- [ ] Form validation works with new role constraints
- [ ] Parent assignment automatically handled for new users
- [ ] Error messages are user-friendly and informative

### **7. Edge Cases & Security**

#### **Test 7.1: URL Manipulation**

- [ ] Users cannot access restricted pages via direct URL
- [ ] API calls respect role-based permissions
- [ ] Frontend properly validates server responses

#### **Test 7.2: Data Consistency**

- [ ] User counts match between different views
- [ ] Parent-child relationships display correctly
- [ ] Order merchant assignments are accurate

---

## 🐛 Known Potential Issues to Check

### **Frontend Code Changes Needed**

Check if frontend expects these old vs new patterns:

1. **Role References**:
   ```javascript
   // OLD: role === "admin"
   // NEW: role === "superadmin"
   ```

2. **User Creation Response**:
   ```javascript
   // NEW fields to handle: parent, createdBy, createdAt
   ```

3. **Order Object Structure**:
   ```javascript
   // NEW fields: merchant, createdBy, invalidatedBy, metadata
   ```

### **API Response Changes**

- User list now includes parent field
- Order list includes merchant references
- Dashboard stats are role-filtered

---

## ✅ Testing Completion Checklist

### **Phase 1: Basic Functionality**

- [ ] All user types can login successfully
- [ ] Role-based navigation works correctly
- [ ] User creation works for allowed roles

### **Phase 2: Data Isolation**

- [ ] Merchants see only their data
- [ ] Users see only their own data
- [ ] Superadmin sees all data

### **Phase 3: Advanced Features**

- [ ] Order management respects role hierarchy
- [ ] Dashboard analytics are properly filtered
- [ ] All edge cases handled gracefully

### **Phase 4: Security Validation**

- [ ] No data leakage between merchants
- [ ] Proper error handling for permission violations
- [ ] UI consistently respects backend permissions

---

## 📝 Testing Notes

**Tester**: ________________
**Date**: ________________

### **Issues Found**:

```
1. Issue description:
   Impact: High/Medium/Low
   Status: Open/Fixed

2. Issue description:
   Impact: High/Medium/Low
   Status: Open/Fixed
```

### **Recommendations**:

```
1. Recommendation 1
2. Recommendation 2
```

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass**: Ready to merge development to main
2. **If Issues Found**: Fix frontend compatibility issues
3. **Documentation Update**: Update frontend docs with role changes
4. **Production Deployment**: Deploy to live environment

---

**© 2024 UPI Mini Gateway v2.0 RBAC Testing**