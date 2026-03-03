# UPI Mini Gateway

<div align="center">

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/code-craka/upi-mini-payment-gw-/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-0-brightgreen.svg)](https://github.com/code-craka/upi-mini-payment-gw-/security)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/code-craka/upi-mini-payment-gw-/codeql.yml?label=CodeQL&logo=github)](https://github.com/code-craka/upi-mini-payment-gw-/actions/workflows/codeql.yml)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

**A secure, production-grade UPI payment gateway with 2-tier RBAC, multi-platform deep links, and real-time monitoring.**

[Live App](https://www.loanpayment.live) · [API](https://api.loanpayment.live) · [Changelog](CHANGELOG.md) · [Report Bug](https://github.com/code-craka/upi-mini-payment-gw-/issues)

</div>

---

## Features

- **Multi-platform UPI**: PhonePe, Paytm, Google Pay, native UPI deep links + QR codes
- **Payment link generator**: Merchants create links with amount, VPA, and expiry timer
- **UTR verification**: Customers submit UTR after payment; merchants confirm
- **2-role RBAC**: `superadmin` (global control) and `merchant` (own orders only)
- **Superadmin order editing**: Edit amount, VPA, or expiry on any live order
- **0 npm vulnerabilities**: All 28 Dependabot alerts resolved
- **Sentry monitoring**: Error tracking and profiling on frontend and backend
- **Rate limiting**: All auth, order, and management endpoints protected

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Framer Motion 12 |
| Backend | Node.js 18+, Express 5.1, TypeScript 5.9 |
| Database | MongoDB Atlas (Mongoose 8) |
| Auth | JWT (jsonwebtoken 9) + bcryptjs (12 rounds) |
| Deployment | Vercel (frontend + backend serverless) |
| Monitoring | Sentry (React + Node.js profiling) |
| Security | express-rate-limit, express-validator, CORS, GitHub CodeQL |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

```bash
git clone https://github.com/code-craka/upi-mini-payment-gw-.git
cd upi-mini-payment-gw-
```

**Frontend:**

```bash
cd frontend && npm install
cp .env.example .env.local   # set VITE_API_URL
npm run dev                   # http://localhost:5173
```

**Backend:**

```bash
cd backend && npm install
cp .env.example .env.local   # set MONGO_URI, JWT_SECRET, APP_BASE_URL
npm run dev                   # http://localhost:3000
```

**Create superadmin:**

```bash
cd backend && node create-superadmin.js
```

### Environment Variables

**Frontend** (`.env.local`):

```env
VITE_API_URL=https://api.loanpayment.live
VITE_FRONTEND_URL=https://www.loanpayment.live
VITE_SENTRY_DSN=your_sentry_dsn
VITE_APP_VERSION=2.1.0
```

**Backend** (`.env.local`):

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/
JWT_SECRET=your_256bit_secret
APP_BASE_URL=https://www.loanpayment.live
API_BASE_URL=https://api.loanpayment.live
SENTRY_DSN=your_sentry_dsn
NODE_ENV=production
```

---

## Project Structure

```
upi-mini-payment-gw-/
├── frontend/src/
│   ├── components/
│   │   ├── admin/            UserManagement
│   │   ├── dashboards/       SuperadminDashboard, MerchantDashboard
│   │   ├── order-management/ OrderList, SuperadminOrderTools
│   │   └── rbac/             ProtectedRoute, PermissionGate, RoleBadge
│   ├── pages/                LoginPage, DashboardPage, PayPage, PaymentGenerator
│   ├── lib/                  upi.ts (deep link builder)
│   └── types/                types.ts
├── backend/src/
│   ├── middleware/            auth.ts, rateLimiter.ts
│   ├── models/                User.ts, Order.ts
│   ├── routes/                auth.ts, users.ts, order.ts, dashboard.ts
│   └── utils/                 roleHelpers.ts, errorHandler.ts, upi.ts
├── docs/
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

---

## RBAC System

| Capability | superadmin | merchant |
|---|---|---|
| Create merchant accounts | ✅ | ❌ |
| View all orders globally | ✅ | ❌ |
| Edit / invalidate any order | ✅ | ❌ |
| Generate payment links | ✅ | ✅ |
| View own orders | ✅ | ✅ |
| Verify UTR submissions | ✅ | ✅ |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Returns JWT |
| GET | `/api/orders` | merchant+ | List orders (role-scoped) |
| POST | `/api/orders` | merchant+ | Create order |
| PATCH | `/api/orders/:id` | superadmin | Edit amount / VPA / expiry |
| POST | `/api/orders/:id/utr` | — | Submit UTR |
| GET | `/api/users` | superadmin | List users |
| POST | `/api/users` | superadmin | Create merchant |
| GET | `/api/dashboard` | merchant+ | Role-filtered stats |

Error shape: `{ "message": "...", "code": "ERROR_CODE" }`

---

## Deployment

Both auto-deploy from `main` via Vercel.

| | Frontend | Backend |
|---|---|---|
| Root directory | `frontend` | `backend` |
| Build command | `npm run build` | `npm run build` |
| Vercel entry | — | `src/server.ts` |

---

## Security

- 0 known npm vulnerabilities (2026-03-03)
- JWT 24h expiry, bcrypt 12 rounds
- Role enforcement at middleware + DB query level
- Rate limiting on all sensitive endpoints
- CORS restricted to `loanpayment.live` origins
- Sentry with `sendDefaultPii: false`
- GitHub CodeQL on every push

Report vulnerabilities to [hello@techsci.io](mailto:hello@techsci.io) — see [SECURITY.md](SECURITY.md).

---

## License

MIT — see [LICENSE](LICENSE).

<div align="center">

Built by [Sayem Abdullah Rihan](https://github.com/code-craka) · [hello@techsci.io](mailto:hello@techsci.io)

</div>
