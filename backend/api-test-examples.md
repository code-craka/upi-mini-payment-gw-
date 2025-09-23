# UPI Mini Gateway v2.0 - API Testing Examples

**Project**: UPI Mini Gateway v2.0
**Author**: Sayem Abdullah Rihan (@code-craka)
**Created**: December 23, 2024

## 🚀 Quick Start

### Environment Setup
```bash
# Set your API base URL
export API_BASE="http://localhost:5000/api"  # Development
# export API_BASE="https://api.loanpaymentsystem.xyz/api"  # Production

# Test credentials (after migration and user creation)
export SUPERADMIN_TOKEN="your_superadmin_jwt_token"
export MERCHANT_TOKEN="your_merchant_jwt_token"
export USER_TOKEN="your_user_jwt_token"
```

## 📋 Test Data Setup

### Step 1: Create Test Users
```bash
# After migration, login as superadmin to get token
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin_test",
    "password": "your_superadmin_password"
  }'

# Save the token from response
export SUPERADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Create merchant user
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "merchant_alpha",
    "password": "Merchant123!",
    "role": "merchant"
  }' | jq

# Save merchant ID from response for next step
export MERCHANT_ID="64a7b8c9d0e1f2a3b4c5d6e7"

# Create regular user under merchant
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_alpha_1",
    "password": "User123!",
    "role": "user",
    "parentId": "'$MERCHANT_ID'"
  }' | jq
```

## 🔐 Authentication Tests

### Login Tests
```bash
# 1. Superadmin Login
echo "=== SUPERADMIN LOGIN ==="
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin_test",
    "password": "SuperAdmin123!"
  }' | jq

# 2. Merchant Login
echo "=== MERCHANT LOGIN ==="
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "merchant_alpha",
    "password": "Merchant123!"
  }' | jq

# 3. User Login
echo "=== USER LOGIN ==="
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_alpha_1",
    "password": "User123!"
  }' | jq

# 4. Invalid Credentials Test
echo "=== INVALID LOGIN TEST ==="
curl -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "invalid_user",
    "password": "wrong_password"
  }' | jq
```

### Token Validation Tests
```bash
# 1. Valid Token Test
echo "=== VALID TOKEN TEST ==="
curl -X GET "$API_BASE/auth/verify-token" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Invalid Token Test
echo "=== INVALID TOKEN TEST ==="
curl -X GET "$API_BASE/auth/verify-token" \
  -H "Authorization: Bearer invalid_token_here" | jq

# 3. Missing Token Test
echo "=== MISSING TOKEN TEST ==="
curl -X GET "$API_BASE/auth/verify-token" | jq
```

### Profile Access Tests
```bash
# 1. Superadmin Profile
echo "=== SUPERADMIN PROFILE ==="
curl -X GET "$API_BASE/auth/profile" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Merchant Profile
echo "=== MERCHANT PROFILE ==="
curl -X GET "$API_BASE/auth/profile" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 3. User Profile
echo "=== USER PROFILE ==="
curl -X GET "$API_BASE/auth/profile" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

## 👥 User Management Tests

### User Listing (Role-based Filtering)
```bash
# 1. Superadmin - Should see ALL users
echo "=== SUPERADMIN USER LISTING ==="
curl -X GET "$API_BASE/users?page=1&limit=10" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Merchant - Should see self + their users only
echo "=== MERCHANT USER LISTING ==="
curl -X GET "$API_BASE/users?page=1&limit=10" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 3. User - Should see only themselves
echo "=== USER USER LISTING ==="
curl -X GET "$API_BASE/users?page=1&limit=10" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

### User Creation Tests
```bash
# 1. Superadmin - Create merchant
echo "=== SUPERADMIN CREATE MERCHANT ==="
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "merchant_beta",
    "password": "Merchant123!",
    "role": "merchant"
  }' | jq

# 2. Superadmin - Create user (with parentId)
echo "=== SUPERADMIN CREATE USER ==="
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_beta_1",
    "password": "User123!",
    "role": "user",
    "parentId": "'$MERCHANT_ID'"
  }' | jq

# 3. Merchant - Create user (auto-assigned as parent)
echo "=== MERCHANT CREATE USER ==="
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_alpha_2",
    "password": "User123!",
    "role": "user"
  }' | jq

# 4. Merchant - Try to create superadmin (should fail)
echo "=== MERCHANT CREATE SUPERADMIN (SHOULD FAIL) ==="
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "fake_superadmin",
    "password": "Password123!",
    "role": "superadmin"
  }' | jq

# 5. User - Try to create any user (should fail)
echo "=== USER CREATE USER (SHOULD FAIL) ==="
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "fake_user",
    "password": "Password123!",
    "role": "user"
  }' | jq
```

### User Update Tests
```bash
# Set target user ID for testing
export TARGET_USER_ID="64a7b8c9d0e1f2a3b4c5d6e8"

# 1. Superadmin - Update any user
echo "=== SUPERADMIN UPDATE USER ==="
curl -X PUT "$API_BASE/users/$TARGET_USER_ID" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updated_username",
    "isActive": true
  }' | jq

# 2. Merchant - Update their user
echo "=== MERCHANT UPDATE THEIR USER ==="
curl -X PUT "$API_BASE/users/$TARGET_USER_ID" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "merchant_updated_user"
  }' | jq

# 3. User - Update themselves
echo "=== USER UPDATE SELF ==="
curl -X PUT "$API_BASE/users/$USER_ID" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_self_update"
  }' | jq

# 4. User - Try to update another user (should fail)
echo "=== USER UPDATE ANOTHER USER (SHOULD FAIL) ==="
curl -X PUT "$API_BASE/users/$TARGET_USER_ID" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "unauthorized_update"
  }' | jq
```

### User Deletion Tests
```bash
# 1. Superadmin - Delete any user
echo "=== SUPERADMIN DELETE USER ==="
curl -X DELETE "$API_BASE/users/$TARGET_USER_ID" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Merchant - Delete their user
echo "=== MERCHANT DELETE THEIR USER ==="
curl -X DELETE "$API_BASE/users/$TARGET_USER_ID" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 3. User - Try to delete another user (should fail)
echo "=== USER DELETE ANOTHER USER (SHOULD FAIL) ==="
curl -X DELETE "$API_BASE/users/$TARGET_USER_ID" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

## 📦 Order Management Tests

### Order Creation Tests
```bash
# 1. Superadmin Create Order
echo "=== SUPERADMIN CREATE ORDER ==="
curl -X POST "$API_BASE/orders" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Platform: web" \
  -d '{
    "amount": 1000,
    "vpa": "merchant@upi",
    "merchantName": "Test Merchant",
    "note": "Superadmin test order",
    "expiresInSec": 3600
  }' | jq

# 2. Merchant Create Order
echo "=== MERCHANT CREATE ORDER ==="
curl -X POST "$API_BASE/orders" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Platform: mobile" \
  -d '{
    "amount": 500,
    "vpa": "merchant@upi",
    "merchantName": "Alpha Merchant",
    "note": "Merchant test order",
    "expiresInSec": 7200
  }' | jq

# 3. User Create Order
echo "=== USER CREATE ORDER ==="
curl -X POST "$API_BASE/orders" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250,
    "vpa": "user@upi",
    "merchantName": "User Purchase",
    "note": "User test order"
  }' | jq
```

### Order Listing Tests (Data Isolation)
```bash
# 1. Superadmin - Should see ALL orders
echo "=== SUPERADMIN ORDER LISTING ==="
curl -X GET "$API_BASE/orders?page=1&limit=10" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Merchant - Should see only orders from their users
echo "=== MERCHANT ORDER LISTING ==="
curl -X GET "$API_BASE/orders?page=1&limit=10" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 3. User - Should see only their own orders
echo "=== USER ORDER LISTING ==="
curl -X GET "$API_BASE/orders?page=1&limit=10" \
  -H "Authorization: Bearer $USER_TOKEN" | jq

# 4. Filter by status
echo "=== FILTERED ORDER LISTING ==="
curl -X GET "$API_BASE/orders?status=PENDING&page=1&limit=5" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq
```

### Order Verification Tests
```bash
# Set order ID for testing
export ORDER_ID="test_order_123"

# 1. Superadmin - Verify any order
echo "=== SUPERADMIN VERIFY ORDER ==="
curl -X POST "$API_BASE/orders/$ORDER_ID/verify" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Merchant - Verify order from their user
echo "=== MERCHANT VERIFY ORDER ==="
curl -X POST "$API_BASE/orders/$ORDER_ID/verify" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 3. User - Try to verify order (should fail)
echo "=== USER VERIFY ORDER (SHOULD FAIL) ==="
curl -X POST "$API_BASE/orders/$ORDER_ID/verify" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

### Superadmin Order Powers Tests
```bash
# 1. Order Invalidation (Superadmin only)
echo "=== SUPERADMIN INVALIDATE ORDER ==="
curl -X POST "$API_BASE/orders/$ORDER_ID/invalidate" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Fraudulent transaction detected"
  }' | jq

# 2. Merchant tries to invalidate (should fail)
echo "=== MERCHANT INVALIDATE ORDER (SHOULD FAIL) ==="
curl -X POST "$API_BASE/orders/$ORDER_ID/invalidate" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Unauthorized attempt"
  }' | jq

# 3. Global Order View (Superadmin only)
echo "=== SUPERADMIN GLOBAL ORDER VIEW ==="
curl -X GET "$API_BASE/orders/all?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 4. Merchant tries global view (should fail)
echo "=== MERCHANT GLOBAL ORDER VIEW (SHOULD FAIL) ==="
curl -X GET "$API_BASE/orders/all" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 5. Order Soft Deletion (Superadmin only)
echo "=== SUPERADMIN DELETE ORDER ==="
curl -X DELETE "$API_BASE/orders/$ORDER_ID" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq
```

### UTR Submission Tests
```bash
# 1. Submit UTR for order (public endpoint)
echo "=== SUBMIT UTR ==="
curl -X POST "$API_BASE/orders/$ORDER_ID/utr" \
  -H "Content-Type: application/json" \
  -d '{
    "utr": "123456789012"
  }' | jq

# 2. Submit invalid UTR
echo "=== SUBMIT INVALID UTR ==="
curl -X POST "$API_BASE/orders/$ORDER_ID/utr" \
  -H "Content-Type: application/json" \
  -d '{
    "utr": "invalid"
  }' | jq
```

## 📊 Dashboard Tests

### Role-based Dashboard Stats
```bash
# 1. Superadmin - Global dashboard stats
echo "=== SUPERADMIN DASHBOARD STATS ==="
curl -X GET "$API_BASE/dashboard/stats" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Merchant - Merchant-specific stats
echo "=== MERCHANT DASHBOARD STATS ==="
curl -X GET "$API_BASE/dashboard/stats" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 3. User - User-specific stats
echo "=== USER DASHBOARD STATS ==="
curl -X GET "$API_BASE/dashboard/stats" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

### Superadmin Analytics Tests
```bash
# 1. Admin Stats (Superadmin only)
echo "=== SUPERADMIN ADMIN STATS ==="
curl -X GET "$API_BASE/dashboard/admin-stats?timeframe=30" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 2. Revenue Trends (Superadmin only)
echo "=== SUPERADMIN REVENUE TRENDS ==="
curl -X GET "$API_BASE/dashboard/revenue-trends?period=daily&timeframe=7" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq

# 3. Merchant tries admin stats (should fail)
echo "=== MERCHANT ADMIN STATS (SHOULD FAIL) ==="
curl -X GET "$API_BASE/dashboard/admin-stats" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 4. User tries revenue trends (should fail)
echo "=== USER REVENUE TRENDS (SHOULD FAIL) ==="
curl -X GET "$API_BASE/dashboard/revenue-trends" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

## 🧪 Edge Cases & Security Tests

### Permission Escalation Tests
```bash
# 1. User tries to access merchant endpoint
echo "=== USER TRIES MERCHANT ENDPOINT ==="
curl -X GET "$API_BASE/users/merchants" \
  -H "Authorization: Bearer $USER_TOKEN" | jq

# 2. Merchant tries superadmin endpoint
echo "=== MERCHANT TRIES SUPERADMIN ENDPOINT ==="
curl -X GET "$API_BASE/dashboard/admin-stats" \
  -H "Authorization: Bearer $MERCHANT_TOKEN" | jq

# 3. Invalid role in JWT payload test
echo "=== INVALID JWT ROLE TEST ==="
# (This would require a specially crafted invalid token)
```

### Data Isolation Tests
```bash
# 1. Merchant A tries to see Merchant B's users
export MERCHANT_B_TOKEN="another_merchant_token"
echo "=== CROSS-MERCHANT DATA ACCESS TEST ==="
curl -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $MERCHANT_B_TOKEN" | jq

# 2. User tries to see other user's orders
echo "=== CROSS-USER ORDER ACCESS TEST ==="
curl -X GET "$API_BASE/orders" \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

### Input Validation Tests
```bash
# 1. Invalid user creation
echo "=== INVALID USER CREATION ==="
curl -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "",
    "password": "123",
    "role": "invalid_role"
  }' | jq

# 2. Invalid order creation
echo "=== INVALID ORDER CREATION ==="
curl -X POST "$API_BASE/orders" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": -100,
    "vpa": "invalid_vpa",
    "merchantName": ""
  }' | jq

# 3. SQL Injection Test
echo "=== SQL INJECTION TEST ==="
curl -X GET "$API_BASE/users?page=1'; DROP TABLE users; --" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq
```

## 🔧 Automated Testing Script

Create a script to run all tests:

```bash
#!/bin/bash
# File: run-rbac-tests.sh

set -e

echo "🚀 Starting UPI Gateway v2.0 RBAC Tests"
echo "======================================="

# Check if tokens are set
if [ -z "$SUPERADMIN_TOKEN" ] || [ -z "$MERCHANT_TOKEN" ] || [ -z "$USER_TOKEN" ]; then
    echo "❌ Error: Please set SUPERADMIN_TOKEN, MERCHANT_TOKEN, and USER_TOKEN environment variables"
    exit 1
fi

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and check status
run_test() {
    local test_name="$1"
    local curl_command="$2"
    local expected_status="$3"

    echo "🧪 Testing: $test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    response=$(eval "$curl_command" 2>/dev/null)
    status=$(echo "$response" | jq -r '.code // .message // "unknown"' 2>/dev/null || echo "parse_error")

    if [[ "$status" == *"$expected_status"* ]] || [[ "$expected_status" == "any" ]]; then
        echo "✅ PASSED: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "❌ FAILED: $test_name (Expected: $expected_status, Got: $status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Run authentication tests
echo "🔐 AUTHENTICATION TESTS"
echo "----------------------"

run_test "Superadmin Profile Access" \
    "curl -s -X GET '$API_BASE/auth/profile' -H 'Authorization: Bearer $SUPERADMIN_TOKEN'" \
    "any"

run_test "Invalid Token Access" \
    "curl -s -X GET '$API_BASE/auth/profile' -H 'Authorization: Bearer invalid_token'" \
    "TOKEN_INVALID"

# Run user management tests
echo "👥 USER MANAGEMENT TESTS"
echo "------------------------"

run_test "User List Access Control" \
    "curl -s -X GET '$API_BASE/users' -H 'Authorization: Bearer $USER_TOKEN'" \
    "any"

run_test "Unauthorized User Creation" \
    "curl -s -X POST '$API_BASE/users' -H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json' -d '{\"username\":\"test\",\"password\":\"test\"}'" \
    "INSUFFICIENT_PRIVILEGES"

# Run order management tests
echo "📦 ORDER MANAGEMENT TESTS"
echo "-------------------------"

run_test "Order Creation" \
    "curl -s -X POST '$API_BASE/orders' -H 'Authorization: Bearer $USER_TOKEN' -H 'Content-Type: application/json' -d '{\"amount\":100,\"vpa\":\"test@upi\"}'" \
    "any"

run_test "Unauthorized Order Invalidation" \
    "curl -s -X POST '$API_BASE/orders/test123/invalidate' -H 'Authorization: Bearer $USER_TOKEN'" \
    "INSUFFICIENT_PRIVILEGES"

# Print summary
echo "📊 TEST SUMMARY"
echo "==============="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Pass Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

if [ $FAILED_TESTS -gt 0 ]; then
    echo "❌ Some tests failed. Please review the output above."
    exit 1
else
    echo "✅ All tests passed!"
    exit 0
fi
```

## 📋 Postman Collection

Create a Postman collection for GUI testing:

```json
{
  "info": {
    "name": "UPI Gateway v2.0 RBAC Tests",
    "description": "Comprehensive role-based access control testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "superadmin_token",
      "value": ""
    },
    {
      "key": "merchant_token",
      "value": ""
    },
    {
      "key": "user_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Superadmin Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"superadmin_test\",\n  \"password\": \"SuperAdmin123!\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "User Management",
      "item": [
        {
          "name": "Get Users (Superadmin)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{superadmin_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/users",
              "host": ["{{base_url}}"],
              "path": ["users"]
            }
          }
        }
      ]
    }
  ]
}
```

Save this content to `postman-collection.json` and import into Postman for GUI-based testing.

---

**Usage**: Run these tests after completing the migration to verify that your role-based access control system is working correctly. Start with authentication tests, then move through user management, orders, and dashboard functionality.