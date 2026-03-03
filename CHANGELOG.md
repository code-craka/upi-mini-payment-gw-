# Changelog

All notable changes to UPI Mini Gateway are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [2.1.0] — 2026-03-03

### Added

- **Claude AI cache infrastructure**: 3-tier caching via Upstash Redis, Mem0, and PostgreSQL with PreToolUse/PostToolUse hooks and intelligent category detection (payments / users / orders / analytics / configuration)
- **Superadmin order edit modal**: PATCH `/api/orders/:id` endpoint + frontend modal to edit amount, VPA, and expiry on any live order
- **PayPage responsive redesign**: Payment methods in 2×4 responsive grid with icon + label; side-by-side UTR input + Submit button; improved timer, amount, and VPA visual hierarchy

### Changed

- **Domain migration**: `pay.loanpaymentsystem.xyz` → `https://www.loanpayment.live`; `api.loanpaymentsystem.xyz` → `https://api.loanpayment.live`
- **Sentry initialization**: Moved from `--import ./instrument.mjs` to inline `index.ts` for Vercel `@vercel/node` compatibility
- **vercel.json**: Removed conflicting `headers` block (cannot coexist with `routes`); entry point changed from `dist/server.js` to `src/server.ts`
- **RBAC**: Collapsed 3-role system (superadmin / merchant / user) to 2 active roles (superadmin + merchant); user role retired from creation

### Fixed

- **Backend 500 on root route**: Caused by uninitalized Sentry — resolved by moving `Sentry.init()` inline
- **VPA empty-string guard**: Removed incorrect guard that blocked valid VPA updates
- **Fetch error handling in edit modal**: Corrected error propagation from PATCH endpoint

### Security

- **28 npm vulnerabilities resolved** (16 high, 11 moderate, 1 low → 0)
  - Frontend: axios (DoS), react-router (CSRF/XSS/redirect), rollup (path traversal), minimatch (ReDoS ×6), tar (arbitrary write ×5), ajv (ReDoS), js-yaml (prototype pollution), vite (fs.deny bypass)
  - Backend: jws (HMAC bypass), validator (URL bypass), minimatch (ReDoS ×3), body-parser (DoS), qs (DoS ×2), lodash (prototype pollution), @sentry/node (header leak), diff (DoS)
- `sendDefaultPii: false` in Sentry to prevent sensitive header leakage

### Removed

- 31 stale files: one-off fix MDs, deployment guides, caching system docs, shell scripts, copilot instructions
- Global cache hook scripts that were failing on every tool call due to missing env vars

---

## [2.0.0] — 2024-09-23

### Added

- **3-tier RBAC system**: `superadmin` → `merchant` → `user` with full data isolation
- **DataFilters utility**: Role-scoped MongoDB query filters (`getUserFilter`, `getOrderFilter`)
- **PermissionHelpers**: `canCreateRole`, `canInvalidateOrder` with privilege escalation prevention
- **ValidationHelpers**: `isValidRoleTransition` to prevent superadmin demotion
- **Order merchant tracking**: `merchant` field auto-assigned from `user.parent` at order creation
- **Superadmin invalidation**: `invalidatedBy` / `invalidatedAt` audit trail on orders
- **Frontend RBAC components**: `ProtectedRoute`, `PermissionGate`, `RoleBadge`, `UserHierarchy`
- **Role-specific dashboards**: `SuperadminDashboard`, `MerchantDashboard`, `UserDashboard`
- **OrderList**: Advanced order management with role-filtered views and invalidation
- **UserManagement**: Role-based user creation with parent assignment
- **Migration scripts**: `scripts/migrate-to-v2.js` and `scripts/test-migration.js`

### Changed

- User model: added `parent` (ObjectId), `canManage()` instance method, pre-save validation
- Order model: added `merchant`, `createdBy`, `invalidatedBy`, `invalidatedAt`, `metadata`
- Auth middleware: `protect` now populates `req.userData` (full User doc)
- All routes: role-based data filtering applied automatically

### Security

- NoSQL injection protection via `QuerySanitizer` (express-mongo-sanitize removed for Express 5 compat)
- Multi-layer validation: express-validator + Mongoose schema + input sanitizer
- Privilege escalation prevention at route and model level

---

## [1.0.1] — 2024-10-04

### Fixed

- Superadmin user creation error — incorrect role validation logic
- Logger format string injection vulnerability
- JWT token expiry edge cases

### Security

- Added rate limiting to order creation endpoint (`orderLimiter`)
- Added JSON payload size limits (`10mb`) to prevent DoS
- Fixed CodeQL warnings on log injection (#67–#81)
- Updated axios, vite to patch Dependabot alerts #1–#4

---

## [1.0.0] — 2024-09-21

### Added

- Initial release: UPI payment gateway with PhonePe, Paytm, Google Pay, native UPI support
- Dynamic QR code generation and countdown timer expiry
- UTR submission and payment verification flow
- JWT authentication + bcrypt password hashing (12 rounds)
- MongoDB Atlas integration with Mongoose schemas
- React 19 frontend with Tailwind CSS glassmorphism design
- Framer Motion animations
- Rate limiting: 100 req / 15 min general, 5 req / 15 min auth
- CORS configuration
- Sentry integration (frontend + backend)
- GitHub Actions CI/CD with CodeQL security scanning
- Vercel deployment for frontend and backend
- Production domains: `pay.loanpaymentsystem.xyz` / `api.loanpaymentsystem.xyz`

---

## Version Summary

| Version | Date | Highlights |
|---|---|---|
| 2.1.0 | 2026-03-03 | Domain migration, 0 vulnerabilities, PayPage redesign, Vercel fixes, cache infra |
| 2.0.0 | 2024-09-23 | 3-tier RBAC, data isolation, frontend RBAC components, migration tooling |
| 1.0.1 | 2024-10-04 | Bug fixes, security patches, rate limiting improvements |
| 1.0.0 | 2024-09-21 | Initial release |
