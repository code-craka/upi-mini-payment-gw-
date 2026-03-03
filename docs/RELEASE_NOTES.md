# Release Notes

---

## v2.1.0 — 2026-03-03 "Production Hardening"

**Author**: Sayem Abdullah Rihan ([@code-craka](https://github.com/code-craka))

### Highlights

This release focuses on production readiness: domain migration, full dependency security patching, a redesigned payment page, Vercel deployment fixes, and a new AI-powered caching infrastructure.

### Domain Migration
- Frontend moved from `pay.loanpaymentsystem.xyz` → **`https://www.loanpayment.live`**
- API moved from `api.loanpaymentsystem.xyz` → **`https://api.loanpayment.live`**
- Non-www `loanpayment.live` correctly redirects (307) to www
- All CORS, env vars, fallback URLs, and documentation updated

### Security: 0 Vulnerabilities
All 28 Dependabot alerts resolved across frontend and backend:

| Package | Severity | Issue |
|---|---|---|
| axios | HIGH | DoS via `__proto__` in mergeConfig |
| react-router | HIGH | CSRF, XSS, open redirect |
| rollup | HIGH | Arbitrary file write via path traversal |
| minimatch | HIGH | Multiple ReDoS patterns |
| tar | HIGH | Arbitrary file write/read, race conditions |
| jws | HIGH | Improper HMAC verification |
| validator | HIGH | URL validation bypass |
| ajv | MODERATE | ReDoS with `$data` option |
| body-parser | MODERATE | DoS via URL encoding |
| qs | MODERATE | DoS via arrayLimit bypass |
| lodash | MODERATE | Prototype pollution in unset/omit |
| @sentry/node | MODERATE | Sensitive header leak (`sendDefaultPii`) |
| diff | LOW | DoS in parsePatch |

### PayPage Redesign
- Payment method icons now displayed in a responsive 2×4 grid with name labels
- Timer styled as a red pill with larger font for urgency
- Amount displayed at `text-2xl font-bold`
- VPA shown with gray background pill for distinction
- UTR input + Submit button arranged side-by-side with focus ring
- Notice text redesigned with red background and bold "Important:" prefix

### Vercel Deployment Fixes
- Fixed `vercel.json` conflict: `routes` and `headers` cannot coexist — headers block removed (CORS already handled by Express)
- Fixed entry point: changed from `dist/server.js` to `src/server.ts` to eliminate 404 NOT_FOUND error
- Fixed Sentry 500 crash: `Sentry.init()` moved inline into `index.ts` — Vercel's `@vercel/node` does not support `--import` flag
- Fixed `sendDefaultPii: false` and `enabledLogs` → `enableLogs` typo

### RBAC Simplification
- Collapsed 3-role system to 2 active roles: `superadmin` and `merchant`
- `user` role retired — no new creation; existing DB records preserved
- Superadmin-only: create merchants, edit any order (amount/VPA/expiry), invalidate orders
- Merchant: generate payment links, view own orders, verify UTRs
- `PATCH /api/orders/:id` endpoint added for superadmin order editing
- Frontend edit modal added to `OrderList`

### Cache Infrastructure
Three-tier Claude AI caching system set up for this project:
- **Upstash Redis**: Category-keyed fast cache with TTL
- **Mem0 AI**: Semantic memory search (`user_id: upi_admin_gateway`)
- **PostgreSQL**: Local persistent store with full metadata
- PreToolUse/PostToolUse hooks with intelligent category detection

### Project Cleanup
Removed 31 stale files (10,134 lines) — one-off fix docs, deployment guides, caching docs, shell scripts.

---

## v2.0.0 — 2024-09-23 "Enterprise RBAC"

### Highlights
Complete 3-tier RBAC overhaul with merchant-user data isolation, audit trails, and migration tooling.

### Major Features
- **3-role hierarchy**: `superadmin` → `merchant` → `user`
- **Data isolation**: Merchants cannot see each other's data
- **Auto-filtering**: All DB queries scoped by role automatically via `DataFilters`
- **Parent-child relationships**: Users auto-assigned to merchant parents
- **Privilege escalation prevention**: Multi-layer validation at route + model level
- **Audit trails**: `invalidatedBy`, `invalidatedAt`, `createdBy` on orders
- **Frontend RBAC**: `ProtectedRoute`, `PermissionGate`, `RoleBadge`, `UserHierarchy`
- **Role dashboards**: Separate views for superadmin, merchant, and user roles
- **Migration tooling**: `migrate-to-v2.js` with dry-run mode + `test-migration.js`

---

## v1.0.1 — 2024-10-04 "Security Patch"

### Fixes
- Superadmin user creation error (incorrect role validation)
- Logger format string injection (CodeQL #67–#81)
- JWT token expiry edge cases

### Security
- Rate limiting added to order creation (`orderLimiter`: 50 req/hr)
- JSON payload size limits (`10mb`) to prevent DoS
- Dependabot alerts #1–#4 resolved (axios, vite)

---

## v1.0.0 — 2024-09-21 "Genesis"

Initial release of UPI Mini Gateway.

### Features
- PhonePe, Paytm, Google Pay, native UPI deep links + QR codes
- Payment link creation with amount, VPA, expiry countdown
- UTR submission and verification
- JWT auth + bcrypt password hashing
- MongoDB Atlas + Mongoose
- React 19 + Tailwind CSS glassmorphism design
- Sentry monitoring (frontend + backend)
- GitHub Actions + CodeQL
- Vercel deployment
