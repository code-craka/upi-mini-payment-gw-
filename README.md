# 🚀 UPI Mini Gateway

<div align="center">

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/code-craka/UPI_MINI_GATEWAY/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/code-craka/UPI_MINI_GATEWAY/codeql.yml?branch=main)](https://github.com/code-craka/UPI_MINI_GATEWAY/actions)
[![Security Rating](https://img.shields.io/badge/security-A+-brightgreen.svg)](https://github.com/code-craka/UPI_MINI_GATEWAY/security)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/code-craka/UPI_MINI_GATEWAY/codeql.yml?label=CodeQL&logo=github)](https://github.com/code-craka/UPI_MINI_GATEWAY/actions/workflows/codeql.yml)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.1+-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Sentry](https://img.shields.io/badge/Monitored%20by-Sentry-362D59?logo=sentry&logoColor=white)](https://sentry.io/)
[![SSL](https://img.shields.io/badge/SSL-Secured-green?logo=letsencrypt&logoColor=white)](https://letsencrypt.org/)

[![GitHub stars](https://img.shields.io/github/stars/code-craka/UPI_MINI_GATEWAY?style=social)](https://github.com/code-craka/UPI_MINI_GATEWAY/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/code-craka/UPI_MINI_GATEWAY?style=social)](https://github.com/code-craka/UPI_MINI_GATEWAY/network/members)
[![GitHub issues](https://img.shields.io/github/issues/code-craka/UPI_MINI_GATEWAY)](https://github.com/code-craka/UPI_MINI_GATEWAY/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/code-craka/UPI_MINI_GATEWAY)](https://github.com/code-craka/UPI_MINI_GATEWAY/pulls)

**A secure, modern UPI payment gateway with beautiful glassmorphism design and enterprise-grade features**

[🌐 Live Demo](https://pay.loanpaymentsystem.xyz) • [📖 Documentation](docs/) • [🚀 Quick Start](#quick-start) • [🛡️ Security](SECURITY.md)

</div>

---

## ✨ Features

<div align="center">

| 🔐 **Security** | 🎨 **Design** | ⚡ **Performance** | 🔧 **DevOps** |
|:---:|:---:|:---:|:---:|
| JWT Authentication | Glassmorphism UI | React 19 | GitHub Actions |
| Bcrypt Encryption | Framer Motion | Vite Build | CodeQL Security |
| Rate Limiting | Responsive Design | MongoDB Atlas | Sentry Monitoring |
| CORS Protection | Dark Gradients | Express 5 | Vercel Deployment |

</div>

### 🏆 Core Features

- **🔗 Multi-Platform UPI Support**: PhonePe, Paytm, Google Pay, UPI native
- **⚡ Real-time Payment Links**: Instant QR code generation with timer expiry
- **📱 Responsive Design**: Beautiful glassmorphism UI that works on all devices
- **🔐 Enterprise Security**: JWT authentication, bcrypt hashing, rate limiting
- **📊 Admin Dashboard**: Comprehensive analytics and user management
- **🎯 UTR Tracking**: Payment verification with UTR submission
- **🚨 Error Monitoring**: Real-time error tracking with Sentry integration
- **⚙️ Modern Stack**: React 19, TypeScript, Express 5, MongoDB Atlas

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.1.4
- **Styling**: Tailwind CSS 4.1+ with Custom Glassmorphism
- **Animations**: Framer Motion 12+
- **State Management**: Redux Toolkit
- **Icons**: React Icons (Feather Icons)
- **Notifications**: SweetAlert2

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express 5.1.0
- **Database**: MongoDB Atlas with Mongoose 8.18
- **Authentication**: JWT + bcryptjs (12 rounds)
- **Security**: CORS, Express Rate Limit
- **Monitoring**: Sentry Node.js + Profiling

### DevOps & Infrastructure
- **Deployment**: Vercel (Frontend + Backend)
- **Database**: MongoDB Atlas Cloud
- **Security**: GitHub Advanced Security + CodeQL
- **Monitoring**: Sentry Error Tracking + Performance
- **CI/CD**: GitHub Actions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **MongoDB Atlas** account
- **Vercel** account (for deployment)

### 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/code-craka/UPI_MINI_GATEWAY.git
cd UPI_MINI_GATEWAY
```

2. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

3. **Setup Backend**
```bash
cd ../backend
npm install
cp .env.example .env.local
# Configure your MongoDB and JWT secrets
npm run build
npm run start
```

4. **Create Superadmin User**
```bash
cd backend
node create-superadmin.js
```

### 🔐 Environment Configuration

#### Frontend (.env.local)
```env
VITE_API_URL=https://api.loanpaymentsystem.xyz
VITE_FRONTEND_URL=https://pay.loanpaymentsystem.xyz
VITE_SENTRY_DSN=your_sentry_frontend_dsn
VITE_APP_VERSION=1.0.0
```

#### Backend (.env.local)
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
JWT_SECRET=your_super_secure_jwt_secret_here
APP_BASE_URL=https://pay.loanpaymentsystem.xyz
API_BASE_URL=https://api.loanpaymentsystem.xyz
SENTRY_DSN=your_sentry_backend_dsn
NODE_ENV=production
```

---

## 📁 Project Structure

```
UPI_MINI_GATEWAY/
├── 📂 frontend/                 # React 19 + TypeScript Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/       # Reusable UI Components
│   │   ├── 📂 pages/           # Application Pages
│   │   ├── 📂 layouts/         # Layout Components
│   │   ├── 📂 types/           # TypeScript Definitions
│   │   └── 📂 utils/           # Utility Functions
│   ├── 📄 package.json
│   └── 📄 vite.config.ts
├── 📂 backend/                  # Node.js + Express Backend
│   ├── 📂 src/
│   │   ├── 📂 models/          # MongoDB Schemas
│   │   ├── 📂 routes/          # API Endpoints
│   │   ├── 📂 middleware/      # Auth & Security
│   │   └── 📂 utils/           # Backend Utilities
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
├── 📂 .github/                  # GitHub Actions & Templates
│   ├── 📂 workflows/           # CI/CD Pipelines
│   └── 📂 codeql/              # Security Configuration
├── 📂 docs/                     # Documentation
├── 📄 README.md
├── 📄 CHANGELOG.md
├── 📄 SECURITY.md
└── 📄 LICENSE
```

---

## 🔧 Development

### 🧪 Available Scripts

#### Frontend Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

#### Backend Commands
```bash
npm run dev        # Start with ts-node
npm run build      # Compile TypeScript
npm run start      # Start production server
npm run create-admin # Create superadmin user
```

### 🔥 Hot Reload Development

1. **Start backend server**:
```bash
cd backend && npm run dev
```

2. **Start frontend server** (new terminal):
```bash
cd frontend && npm run dev
```

3. **Access application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## 🛡️ Security Features

- **🔐 JWT Authentication**: Secure token-based authentication
- **🔒 Password Hashing**: bcrypt with 12 salt rounds
- **🚧 Rate Limiting**: API endpoint protection
- **🛡️ CORS Protection**: Configured for specific domains
- **🔍 Input Validation**: Comprehensive request validation
- **🚨 Error Monitoring**: Real-time error tracking with Sentry
- **🔎 Security Scanning**: GitHub Advanced Security + CodeQL
- **🔑 Environment Security**: Secure secret management

---

## 📊 Monitoring & Analytics

### Sentry Integration
- **Frontend Monitoring**: React error boundaries + performance tracking
- **Backend Monitoring**: Node.js profiling + structured logging
- **Session Replay**: User interaction recording for debugging
- **Performance Insights**: API response time monitoring

### Security Monitoring
- **CodeQL Analysis**: Weekly security scans
- **Dependency Scanning**: Automated vulnerability detection
- **Secret Detection**: Prevention of credential exposure

---

## 🌐 Deployment

### Production Domains
- **Frontend**: https://pay.loanpaymentsystem.xyz
- **Backend API**: https://api.loanpaymentsystem.xyz

### Vercel Configuration
Both frontend and backend are deployed on Vercel with:
- **Automatic SSL/TLS** certificates
- **Global CDN** distribution
- **Environment variables** configured
- **Custom domains** properly routed

---

## 📈 Performance

- **Frontend**: Vite build optimization + code splitting
- **Backend**: Express 5 performance improvements
- **Database**: MongoDB Atlas optimized indexes
- **CDN**: Global content delivery via Vercel
- **Monitoring**: Real-time performance metrics

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### 🔄 Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📋 Code Quality

- **ESLint**: Code linting and formatting
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting (if configured)
- **CodeQL**: Security analysis on PRs

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **MongoDB Atlas** for reliable database hosting
- **Vercel** for seamless deployment platform
- **Sentry** for comprehensive error monitoring
- **GitHub** for advanced security features
- **Open Source Community** for amazing tools and libraries

---

## 📞 Support

- **📧 Email**: [hello@techsci.io](mailto:hello@techsci.io)
- **🐛 Issues**: [GitHub Issues](https://github.com/code-craka/UPI_MINI_GATEWAY/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/code-craka/UPI_MINI_GATEWAY/discussions)

---

<div align="center">

### 👨‍💻 Author

**Sayem Abdullah Rihan**

[![GitHub](https://img.shields.io/badge/GitHub-code--craka-181717?logo=github&logoColor=white)](https://github.com/code-craka)
[![Email](https://img.shields.io/badge/Email-hello%40techsci.io-EA4335?logo=gmail&logoColor=white)](mailto:hello@techsci.io)
[![Website](https://img.shields.io/badge/Website-techsci.io-4285F4?logo=google-chrome&logoColor=white)](https://techsci.io)

---

### ❤️ Built with Love

*Made with passion for modern web development and secure payment solutions*

**⭐ Star this repository if you find it helpful!**

</div>

---

<div align="center">
<sub>© 2024 Sayem Abdullah Rihan. Built with ❤️ using modern web technologies.</sub>
</div>