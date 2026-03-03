# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

UPI Mini Gateway is a monorepo payment gateway — React 19 frontend + Express 5 backend. Supports PhonePe, Paytm, Google Pay, and native UPI with a **2-role RBAC system**: `superadmin` → `merchant`.

| | Local | Production |
|---|---|---|
| Frontend | `http://localhost:5173` | `https://www.loanpayment.live` |
| Backend | `http://localhost:3000` | `https://api.loanpayment.live` |

---

## Development Commands

### Frontend (`/frontend`)

```bash
npm run dev       # Vite dev server on 0.0.0.0:5173
npm run build     # tsc -b + vite build
npm run lint      # ESLint
npx tsc -b --noEmit  # type-check only
```

### Backend (`/backend`)

```bash
npm run dev       # tsx --import ./instrument.mjs src/server.ts
npm run build     # tsc → dist/
npm run start     # node dist/server.js
npm run create-admin  # node create-superadmin.js
npx tsc --noEmit  # type-check only
```

> The backend uses ESM (`"type": "module"`). All local imports **must** use `.js` extensions even for `.ts` source files.

---

## Architecture

### Backend (`backend/src/`)

- **Entry point**: `server.ts` (listen) imports `index.ts` (app setup, Sentry, CORS, routes)
- **Vercel**: `@vercel/node` builds `src/server.ts` directly — no `--import` flag support, so Sentry is initialized inline in `index.ts`

**Route map:**

```
/api/auth      → routes/auth.ts       login
/api/users     → routes/users.ts      CRUD, superadmin only for POST
/api/orders    → routes/order.ts      create, list, UTR submit, invalidate, PATCH (superadmin)
/api/dashboard → routes/dashboard.ts  stats, role-filtered
```

**Middleware chain** (every protected route):

- `protect` — validates JWT, populates `req.user` (id + role) and `req.userData`
- `superadmin` — exact match, superadmin only
- `merchant` — merchant or above (superadmin passes too)

**Rate limiters** (`middleware/rateLimiter.ts`):

- `authLimiter`: 5 req / 15 min
- `apiLimiter`: 100 req / 15 min
- `orderLimiter`: 50 req / hr
- `userManagementLimiter`: 30 req / 15 min
- `dashboardLimiter`: 50 req / 5 min

**NoSQL injection protection** (express-mongo-sanitize removed, Express 5 incompatible):

- `QuerySanitizer.sanitizeFilter()` — `utils/queryHelpers.ts`
- `InputSanitizer` — `utils/errorHandler.ts`
- `express-validator` on all mutation routes
- Mongoose schema validation

### RBAC (`backend/src/utils/roleHelpers.ts`)

**2 active roles** (user role retired — no new creation):

- `superadmin` — creates merchants, edits/invalidates any order, global data access
- `merchant` — generates payment links, views own orders, verifies UTRs

Key exports:

- `DataFilters.getUserFilter(role, userId)` — scoped MongoDB filter
- `DataFilters.getOrderFilter(role, userId)` — scoped MongoDB filter
- `PermissionHelpers.canCreateRole(creatorRole, targetRole)` — superadmin only
- `PermissionHelpers.canInvalidateOrder(role)` — superadmin only
- `ValidationHelpers.isValidRoleTransition(from, to)` — prevents superadmin demotion

### Data Models

**User** (`src/models/User.ts`):

- `role: "superadmin" | "merchant" | "user"` (user retired)
- `parent: ObjectId` — merchant parent (legacy, for existing user records)
- `canManage(targetUser): boolean` — instance permission check

**Order** (`src/models/Order.ts`):

- `merchant` — auto-assigned from `user.parent` at creation
- `createdBy` — who created (may differ from `user`)
- `status`: `PENDING | SUBMITTED | VERIFIED | EXPIRED | CANCELLED | INVALIDATED`
- `invalidatedBy` / `invalidatedAt` — superadmin audit trail

### Frontend (`frontend/src/`)

**Auth state**: `localStorage` — `token` (JWT) + `user` (JSON). No Redux for auth.

**Key directories:**

- `components/rbac/` — `ProtectedRoute`, `PermissionGate`, `RoleBadge`, `UserHierarchy`
- `components/dashboards/` — `SuperadminDashboard`, `MerchantDashboard`
- `components/order-management/` — `OrderList` (with superadmin edit modal), `SuperadminOrderTools`
- `components/admin/` — `UserManagement` (superadmin only)
- `pages/PayPage.tsx` — public payment page, responsive UPI deep-link grid + UTR input
- `pages/PaymentGenerator.tsx` — merchant payment link generator
- `lib/upi.ts` — `providerUri()` builds PhonePe/Paytm/GPay/UPI deep links
- `types/types.ts` — `User`, `OrderEnhanced`, `OrderPublic`, etc.

**Public payment page** (`/pay/:orderId`): unauthenticated, shows UPI deep links, UTR submission.

---

## Key Patterns

### New protected backend route

1. Import `protect` + role middleware from `middleware/auth.ts`
2. Apply `DataFilters.getOrderFilter()` / `getUserFilter()` for role-scoped queries
3. Add `express-validator` validation before the handler
4. Apply the appropriate rate limiter

### New frontend admin feature

1. Wrap route in `<ProtectedRoute requiredRoles={[...]}>`
2. Use `<PermissionGate requiredRole="superadmin">` for conditional rendering
3. Read `user` from `JSON.parse(localStorage.getItem("user"))` as `User` type

### API error shape

```json
{ "message": "...", "code": "ERROR_CODE" }
```

Validation errors: `{ "code": "VALIDATION_ERROR", "errors": [...] }`

### ESM imports (backend)

```typescript
import { something } from "./roleHelpers.js";  // .js, not .ts
```

### VPA / UPI link

- `isValidVpa(vpa)` — `backend/src/utils/upi.ts`
- `buildUpiLink({ pa, pn, am, tn, tr })` — rebuild whenever amount OR vpa changes

---

## Environment Variables

**Backend** (`.env.local`):

```
MONGO_URI        MongoDB Atlas connection string
JWT_SECRET       256-bit minimum
APP_BASE_URL     frontend origin for CORS (https://www.loanpayment.live)
API_BASE_URL     backend URL (https://api.loanpayment.live)
SENTRY_DSN       optional — enables Sentry when set
NODE_ENV         production | development
```

**Frontend** (`.env.local`, prefix `VITE_`):

```
VITE_API_URL          backend base URL
VITE_FRONTEND_URL     frontend URL
VITE_SENTRY_DSN       optional
VITE_APP_VERSION      app version string
```

---

## Deployment (Vercel)

- **Frontend project**: auto-deploys from `main`, root = `/frontend`
- **Backend project**: auto-deploys from `main`, root = `backend`, entry = `src/server.ts`
- `backend/vercel.json` must NOT mix `routes` + `headers` — Vercel rejects the combination
- Sentry initialized inside `index.ts` (Vercel's `@vercel/node` has no `--import` flag)

---

## Commit Conventions

```
feat:     new feature
fix:      bug fix
docs:     documentation only
security: security fix
chore:    maintenance / tooling
```
