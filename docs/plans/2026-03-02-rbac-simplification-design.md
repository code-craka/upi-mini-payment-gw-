# RBAC Simplification Design
**Date:** 2026-03-02
**Status:** Approved
**Approach:** Surgical Removal (A)

## Problem Statement

The current system has a 3-role hierarchy (superadmin → merchant → user). The desired behavior is:

- **Superadmin**: Full control — create/delete merchants, edit/invalidate any payment link
- **Merchant**: Payment link generation only — no user management capability
- **User role**: Retired (no new user-role accounts created; existing records preserved)

## Role Permission Matrix

| Capability | superadmin | merchant |
|---|---|---|
| Create merchant account | ✅ | ❌ |
| Create user account | ✅ (legacy only) | ❌ (was ✅, now blocked) |
| Delete/deactivate merchant | ✅ | ❌ |
| Generate payment link | ✅ | ✅ |
| View own orders | ✅ | ✅ |
| View all orders globally | ✅ | ❌ |
| Verify order UTR | ✅ | ✅ (own orders) |
| Invalidate any order | ✅ | ❌ |
| **Edit order (amount/VPA/expiry)** | ✅ **NEW** | ❌ |
| Soft delete order | ✅ | ❌ |
| Public pay page | public | public |

## Backend Changes

### 1. Block merchant user-creation (routes/users.ts)
Change the guard on `POST /api/users` from `merchant` middleware (merchant-or-above) to `superadmin` middleware (superadmin-exact). This prevents merchants from calling the user creation endpoint entirely.

```
Before: router.post("/", protect, merchant, ...)
After:  router.post("/", protect, superadmin, ...)
```

### 2. New endpoint: Edit order (routes/order.ts)
```
PATCH /api/orders/:orderId
Middleware: protect, superadmin
Body (all fields optional):
  amount:    number (min: 1)
  vpa:       string (validated via isValidVpa())
  expiresAt: ISO date string

Business rules:
  - Reject if order status is INVALIDATED or EXPIRED
  - Validate VPA if provided
  - Partial update (only provided fields changed)
  - Return updated order object

Error codes:
  INVALID_STATUS     — order not in editable state
  INVALID_VPA        — VPA fails validation
  ORDER_NOT_FOUND    — orderId not found or isActive=false
  VALIDATION_ERROR   — express-validator failures
```

### 3. roleHelpers.ts — canCreateRole update
Update `PermissionHelpers.canCreateRole()` so merchant returns `false` for all target roles. This is a defense-in-depth layer since the route guard already blocks it at the middleware level.

```typescript
case "merchant":
  return false; // was: return targetRole === "user"
```

## Frontend Changes

### App.tsx
Change `UserManagementPage` route from `requiredRoles={["superadmin", "merchant"]}` to `requiredRoles={["superadmin"]}`.

### components/admin/UserManagement.tsx
- Remove `"user"` from the role dropdown options
- Remove `parentId` merchant selector and related merchant-fetch logic
- Remove `merchantError` state
- Role options available: `superadmin`, `merchant`

### components/dashboards/MerchantDashboard.tsx
Simplify to two sections only:
1. Payment link generator (amount + VPA input → generates shareable link)
2. Recent orders list (their orders: columns = Order ID, Amount, Status, Created, Verify action)

Remove: stat cards, user management sections, top-users list.

### components/order-management/OrderList.tsx
Add Edit action (superadmin only, wrapped in `PermissionGate`):
- Edit button per order row → opens inline modal
- Modal fields: Amount (number), VPA (text), Expiry (datetime-local)
- On submit: `PATCH /api/orders/:orderId` with only changed fields
- On success: refresh order list

### Navigation (Layout.tsx)
- Hide "Users" nav link for merchant role (already hidden via role check, verify this is correct)
- No new nav items needed

## Data Model

No schema changes. The `user` role enum value and `parent` field remain in `User` schema to protect existing documents. No DB migration required.

## What Does NOT Change

- `GET /api/orders` — already role-filtered by `DataFilters.getOrderFilter()`
- `POST /api/orders` — both roles can create orders (no change)
- `POST /api/orders/:id/verify` — merchant + superadmin (no change)
- `POST /api/orders/:id/invalidate` — superadmin only (no change)
- `DELETE /api/orders/:id` — superadmin only (no change)
- `DELETE /api/users/:id` — superadmin can delete merchant (already works)
- `/pay/:orderId` — public, unauthenticated (no change)
- Sentry, rate limiters, CORS — no change

## Implementation Sequence

1. Backend: update `POST /api/users` guard → superadmin only
2. Backend: update `canCreateRole()` in roleHelpers.ts
3. Backend: add `PATCH /api/orders/:orderId` endpoint
4. Frontend: fix App.tsx route guard
5. Frontend: update UserManagement.tsx (remove user-role creation)
6. Frontend: simplify MerchantDashboard.tsx
7. Frontend: add Edit action to OrderList.tsx
8. Manual test: create merchant, login as merchant, verify cannot access user creation, generate link, verify admin can edit/invalidate
