# UPI Mini Gateway - AI Coding Agent Instructions

## Architecture Overview

TypeScript monorepo with dual Vercel deployment: React 19 frontend (pay.loanpaymentsystem.xyz) + Express 5 backend (api.loanpaymentsystem.xyz). Implements 3-tier RBAC: `superadmin` (level 3) > `merchant` (level 2) > `user` (level 1).

**Stack**: React 19 + Vite + Tailwind 4 | Express 5 + MongoDB Atlas | JWT auth + bcrypt (12 rounds) | Sentry monitoring | Vercel serverless

## Critical RBAC Architecture

### Hierarchy Rules (`backend/src/utils/roleHelpers.ts`)
```typescript
ROLE_HIERARCHY = { user: 1, merchant: 2, superadmin: 3 }
```

**Data Isolation Patterns:**
- Users **MUST** have `parent: ObjectId` (merchant reference) - enforced by pre-save hook in `User.ts`
- Orders auto-inherit merchant via pre-save: `user.role === 'user' ? user.parent : user._id`
- Merchants/superadmins **CANNOT** have parent (validation error if set)
- All models use `canManage(targetUser)` instance method for permission checks
- Database queries auto-filter by role using `DataFilters.getOrderFilter()`/`getUserFilter()`

### Auth Flow Implementation
**Backend** (`backend/src/middleware/auth.ts`):
- `protect` middleware populates both `req.user` (basic) and `req.userData` (full Document with populations)
- Use `req.userData` for relationship checks, `req.user` for role checks
- JWT payload: `{ userId, role }` - role synced from database on each request

**Frontend** (`frontend/src/utils/api.ts`):
- Axios interceptor adds `Authorization: Bearer <token>` from localStorage
- 401 responses auto-clear token and redirect to `/login`
- `PermissionGate` component reads role from `localStorage.getItem('user')`

## Essential Commands

```bash
# Development workflow
cd backend && npm run dev        # ts-node watch mode on port 3000
cd frontend && npm run dev       # Vite dev server on port 5173

# Database setup
cd backend && npm run create-admin  # Creates superadmin:admin123 (change after login!)
npm run migrate-v2-dry              # Test v2 RBAC migration
npm run migrate-v2                  # Apply migration (adds parent/merchant fields)

# Deployment (automatic via Vercel on push to main)
# Manually trigger: Push to main branch → Vercel auto-deploys both projects
```

## Code Patterns You Must Follow

### 1. Model Pre-Save Hooks for Validation
Both `User.ts` and `Order.ts` use pre-save middleware for data integrity:
```typescript
// User.ts - Validates parent relationship
UserSchema.pre("save", async function(next) {
  if (this.role === "user" && !this.parent) {
    return next(new Error("Users must have a merchant parent"));
  }
});

// Order.ts - Auto-assigns merchant
OrderSchema.pre("save", async function(next) {
  if (this.isNew && !this.merchant) {
    const user = await User.findById(this.user);
    this.merchant = user.role === "user" ? user.parent : user._id;
  }
});
```

### 2. Permission Checking Pattern
**Backend routes**: Use middleware stack for declarative permissions
```typescript
router.get("/users/:id", protect, canManageTargetUser, async (req, res) => {
  // Logic runs only if user can manage target
});

// Or use role helpers in route logic
if (!PermissionHelpers.canCreateRole(req.user.role, targetRole)) {
  return res.status(403).json({ code: "INSUFFICIENT_PRIVILEGES" });
}
```

**Frontend components**: Wrap with `PermissionGate`
```tsx
<PermissionGate requiredRole="merchant">
  <UserCreateButton />
</PermissionGate>
```

### 3. Database Query Filters
ALWAYS apply role-based filters from `roleHelpers.ts`:
```typescript
import { DataFilters } from "../utils/roleHelpers.js";

const filter = DataFilters.getOrderFilter(req.user.role, req.user.userId);
const orders = await Order.find(filter).populate("user merchant");
```

### 4. Sentry Instrumentation (CRITICAL ORDER)
**Must import FIRST** before any other modules:
```typescript
// backend/src/index.ts
import "./instrument.js";  // MUST BE FIRST
import express from "express";

// frontend/src/main.tsx  
import "./instrument.ts";  // MUST BE FIRST
import React from "react";
```

## Integration Points

### MongoDB Schema Indexes
Models use compound indexes for role-based queries:
```typescript
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ parent: 1, isActive: 1 });
OrderSchema.index({ merchant: 1, status: 1, createdAt: -1 });
```

### Vercel Dual Deployment (`vercel.json`)
- Root config manages 2 projects: `frontend` (source) + `backend` (functions)
- Backend compiles to `dist/server.js` via `npm run build` (tsc)
- Frontend rewrites `/api/*` to backend domain for dev proxy
- Env vars set per-project in Vercel dashboard (NOT in vercel.json)

### Order ID Generation
Uses `nanoid` (5 chars) + timestamp:
```typescript
import { nanoid } from "nanoid";
orderId: `ORD-${Date.now()}-${nanoid(5).toUpperCase()}`
```

## Development Gotchas

### Auth Edge Cases
- JWT secret **must be 32+ chars** or token signing fails silently
- `protect` middleware fetches fresh user data on every request (handles role changes)
- Frontend stores user object as string: `JSON.parse(localStorage.getItem('user'))`

### RBAC Validation Failures
- Creating user without merchant parent → pre-save hook throws error
- Merchant trying to create merchant → `PermissionHelpers.canCreateRole()` returns false
- Order without merchant → auto-assigned in pre-save hook (never null)

### Deployment Environment Variables
**Backend Vercel env** (required):
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=<32+ character string>
SENTRY_DSN=<backend dsn>
```

**Frontend Vercel env** (required):
```
VITE_API_URL=https://api.loanpaymentsystem.xyz
VITE_SENTRY_DSN=<frontend dsn>
```

### Order Status Flow
```
PENDING → SUBMITTED (user submits UTR) → VERIFIED (merchant confirms)
       ↓
    EXPIRED (after expiresAt timestamp)
    INVALIDATED (superadmin only, includes reason)
```

## Testing Checklist

When modifying RBAC features, verify:
1. **Hierarchy enforcement**: User creation validates parent is merchant
2. **Data isolation**: Merchant A cannot see merchant B's users/orders
3. **Permission boundaries**: Users cannot create users, merchants cannot invalidate orders
4. **Frontend guards**: `PermissionGate` hides unauthorized UI elements
5. **Token expiration**: 401 triggers logout redirect

## Quick Reference

**Key Files:**
- `backend/src/models/{User,Order}.ts` - Mongoose schemas with pre-save hooks
- `backend/src/utils/roleHelpers.ts` - RBAC helpers (DataFilters, PermissionHelpers)
- `backend/src/middleware/auth.ts` - JWT verification + role middleware
- `frontend/src/components/rbac/PermissionGate.tsx` - Conditional rendering
- `frontend/src/types/types.ts` - TypeScript interfaces for all entities

**Debug Endpoints:**
- `GET /api/debug/permissions/:userId` - Test permission logic
- `GET /api/debug/system-integrity` - Validate data relationships (superadmin only)