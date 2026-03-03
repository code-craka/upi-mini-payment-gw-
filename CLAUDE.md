# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UPI Mini Gateway is a monorepo payment gateway with a React 19 frontend and Express 5 backend. It supports multi-platform UPI payments (PhonePe, Paytm, Google Pay, Native UPI) with a 3-tier RBAC system: `superadmin` → `merchant` → `user`.

- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend**: `http://localhost:3000`
- **Production Frontend**: `https://www.loanpayment.live`
- **Production API**: `https://api.loanpayment.live`

---

## Development Commands

### Frontend (`/frontend`)

```bash
npm run dev       # Start Vite dev server on 0.0.0.0:5173
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Backend (`/backend`)

```bash
npm run dev       # tsx with Sentry instrumentation via --import ./instrument.mjs
npm run build     # tsc → dist/
npm run start     # node dist/server.js
npm run create-admin     # node create-superadmin.js

# v2 RBAC migration
npm run migrate-v2-dry   # Dry run (safe)
npm run migrate-v2       # Execute migration
npm run test-migration   # Validate results
```

The backend uses ESM (`"type": "module"`). All internal imports must use `.js` extensions even for TypeScript source files.

---

## Architecture

### Backend (`backend/src/`)

Entry point: `index.ts` (app setup) + `server.ts` (listen). Sentry is loaded via `--import ./instrument.mjs` before the app starts.

**Route → Middleware → Model flow:**

```
/api/auth      → routes/auth.ts      (login, register [deprecated])
/api/users     → routes/users.ts     (CRUD, role-filtered)
/api/orders    → routes/order.ts     (create, list, UTR submit, invalidate)
/api/dashboard → routes/dashboard.ts (stats, role-filtered)
```

Every protected route uses `protect` (JWT validation) from `middleware/auth.ts`. After `protect`, `req.user` (id + role) and `req.userData` (full populated User doc) are available.

Role enforcement uses composable middleware:
- `protect` — validates JWT, populates `req.user` and `req.userData`
- `superadmin` — exact match, superadmin only
- `merchant` — merchant or above
- `merchantOnly` — exact match, merchant only
- `canManageTargetUser` — dynamic check using `User.canManage()`

**Rate limiters** (`middleware/rateLimiter.ts`):
- `authLimiter`: 5 req / 15 min (login/register)
- `apiLimiter`: 100 req / 15 min (general)
- `orderLimiter`: 50 req / hr (order creation)
- `userManagementLimiter`: 30 req / 15 min
- `dashboardLimiter`: 50 req / 5 min

**NoSQL injection protection** (express-mongo-sanitize removed for Express 5 compatibility):
- `QuerySanitizer.sanitizeFilter()` in `utils/queryHelpers.ts`
- `InputSanitizer` in `utils/errorHandler.ts`
- `express-validator` on all mutation routes
- Mongoose schema validation

### RBAC Core (`backend/src/utils/roleHelpers.ts`)

Role hierarchy: `user: 1`, `merchant: 2`, `superadmin: 3`

Key exports:
- `ROLE_HIERARCHY` — numeric level map
- `isRoleAtOrAbove(userRole, requiredRole)` — hierarchy comparison
- `DataFilters.getUserFilter(role, userId)` — MongoDB filter for user queries
- `DataFilters.getOrderFilter(role, userId)` — MongoDB filter for order queries
- `PermissionHelpers.canCreateRole(creatorRole, targetRole)` — creation permission
- `PermissionHelpers.canInvalidateOrder(role)` — superadmin only

### Data Models

**User** (`src/models/User.ts`):
- `role: "superadmin" | "merchant" | "user"`
- `parent: ObjectId` — merchant parent for `user` role (required, validated in pre-save hook)
- `canManage(targetUser: IUser): boolean` — instance method for permission checks
- Merchants/superadmins cannot have a `parent`; users must have a merchant `parent`

**Order** (`src/models/Order.ts`):
- `user` — the paying user
- `merchant` — auto-assigned from `user.parent` at creation
- `createdBy` — who created the order (may differ from `user`)
- `status`: `PENDING | SUBMITTED | VERIFIED | EXPIRED | CANCELLED | INVALIDATED`
- `invalidatedBy` / `invalidatedAt` — superadmin invalidation tracking

### Frontend (`frontend/src/`)

**Routing** (`App.tsx`): React Router v7 with `ProtectedRoute` wrapping admin routes.

**Auth state**: Stored in `localStorage` as `token` (JWT) and `user` (JSON). The `Layout.tsx` reads both directly. No Redux for auth — Redux Toolkit is present but auth is localStorage-based.

**Key directories:**
- `components/rbac/` — `ProtectedRoute`, `PermissionGate`, `RoleBadge`, `UserHierarchy`
- `components/dashboards/` — `SuperadminDashboard`, `MerchantDashboard`, `UserDashboard`
- `components/order-management/` — `OrderList`, `SuperadminOrderTools`
- `components/user-management/` — `UserCard`, `UserCreateForm`
- `lib/upi.ts` — `providerUri()` builds deep links for PhonePe/Paytm/GPay/UPI
- `types/types.ts` — shared TypeScript interfaces (`User`, `OrderEnhanced`, `OrderPublic`, etc.)

**Public payment page** (`/pay/:orderId`): Unauthenticated route. Fetches order by ID, shows UPI deep links (PhonePe, Paytm, Google Pay, generic UPI), and allows UTR submission.

**API calls**: All use `axios` with `VITE_API_URL` env var, falling back to `https://api.loanpayment.live`.

---

## Key Patterns

### Adding a new protected backend route

1. Import `protect` + role middleware from `middleware/auth.ts`
2. Use `DataFilters.getOrderFilter()` / `DataFilters.getUserFilter()` for role-scoped DB queries
3. Add `express-validator` body/query validation before the handler
4. Apply the appropriate rate limiter

### Adding a frontend admin feature

1. Wrap the route in `ProtectedRoute` with `requiredRoles`
2. Use `PermissionGate` for conditional rendering within components
3. Read `user` from `localStorage.getItem("user")` parsed as `User` type

### Environment variables

Backend reads from `.env.local` via `dotenv`. Required:
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — minimum 256-bit secret
- `APP_BASE_URL` — frontend origin (for CORS)
- `API_BASE_URL` — backend URL
- `SENTRY_DSN` — optional, controls Sentry

Frontend reads Vite env vars (prefix `VITE_`):
- `VITE_API_URL` — backend base URL

---

## Commit Conventions

```
feat:     new feature
fix:      bug fix
docs:     documentation
security: security fix
chore:    maintenance
```
