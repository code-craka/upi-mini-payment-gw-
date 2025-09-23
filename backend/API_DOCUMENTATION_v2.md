# UPI Mini Gateway API Documentation v2.0

**Version**: 2.0.0
**Author**: Sayem Abdullah Rihan (@code-craka)
**Last Updated**: September 23, 2024
**Base URL**: `https://api.loanpaymentsystem.xyz`

---

## 🚀 Overview

UPI Mini Gateway v2.0 introduces a comprehensive 3-role hierarchy system with enhanced data isolation, security, and merchant management capabilities.

### **Role Hierarchy**

```
superadmin (Level 3)
    ├── merchant (Level 2)
    │   └── user (Level 1)
    └── merchant (Level 2)
        └── user (Level 1)
```

### **Key Features**

- **Data Isolation**: Complete segregation between merchants and their users
- **Role-Based Access Control**: Granular permissions based on hierarchy
- **Audit Trails**: Comprehensive tracking for all operations
- **Enhanced Security**: Multi-layer validation and privilege escalation prevention
- **Backward Compatibility**: Seamless upgrade from v1.x

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Authentication Flow

1. **Login** → Receive JWT token
2. **Include token** in all subsequent requests
3. **Token expires** after 24 hours

---

## 📊 Role-Based Data Access

### **Superadmin Access**
- ✅ View all users across all merchants
- ✅ View all orders globally
- ✅ Create merchants and users
- ✅ Invalidate any order
- ✅ Access global analytics

### **Merchant Access**
- ✅ View only their own users
- ✅ View only orders from their users
- ✅ Create users under their account
- ❌ Cannot access other merchants' data
- ❌ Cannot invalidate orders

### **User Access**
- ✅ View only their own profile
- ✅ View only their own orders
- ✅ Create orders
- ❌ Cannot access other users' data
- ❌ Cannot create users

---

## 🔗 API Endpoints

### **Authentication Routes** (`/api/auth`)

#### **POST /api/auth/login**
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "merchant_user",
    "role": "merchant",
    "parent": null,
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2024-09-23T00:00:00.000Z",
    "isActive": true
  }
}
```

**Error Responses:**
- `400` - Missing credentials
- `401` - Invalid credentials
- `403` - Account inactive

---

### **User Management Routes** (`/api/users`)

#### **GET /api/users**
Get list of users based on role permissions.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Results per page
- `role` (string) - Filter by role: `user`, `merchant`, `superadmin`
- `search` (string) - Search by username

**Authorization Required:** Any authenticated user

**Response:**
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "role": "user",
      "parent": "507f1f77bcf86cd799439012",
      "isActive": true,
      "createdAt": "2024-09-23T00:00:00.000Z",
      "createdBy": "507f1f77bcf86cd799439012"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### **POST /api/users**
Create a new user (role-based permissions apply).

**Authorization Required:** `superadmin` or `merchant`

**Request:**
```json
{
  "username": "new_user",
  "password": "secure_password",
  "role": "user"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439013",
    "username": "new_user",
    "role": "user",
    "parent": "507f1f77bcf86cd799439012",
    "isActive": true,
    "createdAt": "2024-09-23T00:00:00.000Z",
    "createdBy": "507f1f77bcf86cd799439012"
  }
}
```

**Role-Based Rules:**
- **Superadmin**: Can create `merchant` or `user` roles
- **Merchant**: Can only create `user` roles (auto-assigned as parent)
- **User**: Cannot create users

#### **GET /api/users/:id**
Get specific user details.

**Authorization Required:** Based on role hierarchy

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "role": "user",
  "parent": "507f1f77bcf86cd799439012",
  "isActive": true,
  "createdAt": "2024-09-23T00:00:00.000Z",
  "orderStats": {
    "total": 25,
    "pending": 3,
    "completed": 22
  }
}
```

#### **PUT /api/users/:id**
Update user information.

**Authorization Required:** Based on `canManage()` permissions

**Request:**
```json
{
  "username": "updated_username",
  "isActive": true
}
```

#### **DELETE /api/users/:id**
Soft delete user (sets `isActive: false`).

**Authorization Required:** Based on role hierarchy

---

### **Order Management Routes** (`/api/orders`)

#### **GET /api/orders**
Get orders list with role-based filtering.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string) - Filter by status
- `search` (string) - Search by order ID or UTR

**Authorization Required:** Any authenticated user

**Response:**
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "orderId": "ORD-1727045200000-ABC123",
      "amount": 1500,
      "vpa": "merchant@paytm",
      "merchantName": "Test Merchant",
      "status": "PENDING",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "john_doe",
        "role": "user"
      },
      "merchant": {
        "_id": "507f1f77bcf86cd799439012",
        "username": "merchant_user"
      },
      "createdAt": "2024-09-23T00:00:00.000Z",
      "expiresAt": "2024-09-23T01:00:00.000Z",
      "metadata": {
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "platform": "web"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalOrders": 200
  }
}
```

**Data Filtering:**
- **Superadmin**: All active orders
- **Merchant**: Only orders from their users
- **User**: Only their own orders

#### **POST /api/orders**
Create a new payment order.

**Authorization Required:** Any authenticated user

**Request:**
```json
{
  "amount": 1500,
  "vpa": "merchant@paytm",
  "merchantName": "Test Merchant",
  "note": "Payment for services",
  "expiresInSec": 3600
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439014",
    "orderId": "ORD-1727045200000-ABC123",
    "amount": 1500,
    "vpa": "merchant@paytm",
    "merchantName": "Test Merchant",
    "note": "Payment for services",
    "status": "PENDING",
    "expiresAt": "2024-09-23T01:00:00.000Z",
    "upiLink": "upi://pay?pa=merchant@paytm&pn=Test%20Merchant&tr=ORD-1727045200000-ABC123&am=1500&cu=INR&tn=Payment%20for%20services",
    "user": "507f1f77bcf86cd799439011",
    "merchant": "507f1f77bcf86cd799439012",
    "createdAt": "2024-09-23T00:00:00.000Z"
  }
}
```

#### **GET /api/orders/:id**
Get specific order details.

**Authorization Required:** Based on role hierarchy and order ownership

#### **PUT /api/orders/:id/submit-utr**
Submit UTR for order verification.

**Authorization Required:** Order owner or merchant

**Request:**
```json
{
  "utr": "123456789012"
}
```

#### **PUT /api/orders/:id/verify**
Verify order (merchant only).

**Authorization Required:** Merchant who owns the order

#### **PUT /api/orders/:id/invalidate**
Invalidate order (superadmin only).

**Authorization Required:** `superadmin` role only

**Request:**
```json
{
  "reason": "Fraudulent transaction"
}
```

---

### **Dashboard & Analytics Routes** (`/api/dashboard`)

#### **GET /api/dashboard/stats**
Get dashboard statistics based on role.

**Authorization Required:** Any authenticated user

**Response (Superadmin):**
```json
{
  "stats": {
    "totalUsers": 1250,
    "totalMerchants": 45,
    "totalOrders": 15680,
    "totalRevenue": 2456789,
    "activeOrders": 234,
    "todayOrders": 89,
    "pendingOrders": 45,
    "verifiedOrders": 15391
  },
  "recentActivity": [
    {
      "type": "order_created",
      "user": "john_doe",
      "amount": 1500,
      "timestamp": "2024-09-23T00:00:00.000Z"
    }
  ],
  "chartData": {
    "dailyRevenue": [
      { "date": "2024-09-22", "revenue": 45600 },
      { "date": "2024-09-23", "revenue": 52300 }
    ]
  }
}
```

**Response (Merchant):**
```json
{
  "stats": {
    "totalUsers": 25,
    "totalOrders": 456,
    "totalRevenue": 68900,
    "activeOrders": 12,
    "todayOrders": 8,
    "pendingOrders": 3
  },
  "recentActivity": [
    // Only their users' activities
  ]
}
```

**Response (User):**
```json
{
  "stats": {
    "totalOrders": 12,
    "totalSpent": 18500,
    "pendingOrders": 1,
    "verifiedOrders": 11
  }
}
```

---

### **Debug Routes** (`/api/debug`) - Development Only

#### **GET /api/debug/permissions/:userId?**
Debug user permissions and relationships.

**Authorization Required:** Any authenticated user (self-debug always allowed)

#### **GET /api/debug/system-integrity**
Validate system-wide data integrity.

**Authorization Required:** `superadmin` only

#### **GET /api/debug/rbac-filters**
Test role-based access control filters.

**Authorization Required:** Any authenticated user

---

## 🛡️ Security Features

### **Data Isolation**
- Merchants cannot access other merchants' data
- Users cannot access other users' data
- Automatic filtering based on role hierarchy

### **Permission Validation**
- Every endpoint validates user permissions
- Privilege escalation prevention
- Audit trails for all operations

### **Error Handling**
- Structured error responses
- No sensitive data leakage
- Proper HTTP status codes

### **Rate Limiting**
- 100 requests per 15 minutes per IP
- Additional protection on sensitive endpoints

---

## 📝 Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2024-09-23T00:00:00.000Z",
  "requestId": "req_abc123"
}
```

### Common Error Codes
- `AUTH_REQUIRED` (401) - Authentication required
- `INSUFFICIENT_PERMISSIONS` (403) - Insufficient permissions
- `RESOURCE_NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Request validation failed
- `DUPLICATE_RESOURCE` (409) - Resource already exists
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests

---

## 🔄 Migration from v1.x

### **Breaking Changes**
- Role enum updated: `admin` → `superadmin`
- New parent-child relationships for merchants and users
- Enhanced data filtering and permissions

### **Backward Compatibility**
- All existing endpoints maintain same response format
- Legacy `admin` role automatically mapped to `superadmin`
- Existing data automatically migrated with migration script

---

## 🧪 Testing

### **Authentication Testing**
```bash
# Login
curl -X POST https://api.loanpaymentsystem.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### **Protected Endpoint Testing**
```bash
# Get users (with token)
curl -X GET https://api.loanpaymentsystem.xyz/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Role Permission Testing**
```bash
# Test merchant creating user
curl -X POST https://api.loanpaymentsystem.xyz/api/users \
  -H "Authorization: Bearer MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"password","role":"user"}'
```

---

## 📚 Additional Resources

- **Migration Guide**: `DEPLOYMENT_GUIDE_v2.md`
- **Changelog**: `CHANGELOG.md`
- **Security Policy**: `SECURITY.md`
- **Development Setup**: `README.md`

---

**© 2024 Sayem Abdullah Rihan - UPI Mini Gateway v2.0**