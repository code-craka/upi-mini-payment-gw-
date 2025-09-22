# 🌐 Domain Configuration Guide - UPI Mini Gateway

*Updated: September 22, 2025*

## 🎯 **New Domain Configuration**

Your UPI Mini Gateway application has been successfully configured for the following domains:

### **Frontend Domain:**
- **Primary:** `https://pay.loanpaymentsystem.xyz`
- **WWW Variant:** `https://www.pay.loanpaymentsystem.xyz`

### **Backend API Domain:**
- **Primary:** `https://api.loanpaymentsystem.xyz`
- **WWW Variant:** `https://www.api.loanpaymentsystem.xyz`

---

## 📋 **Configuration Changes Made**

### 1. **Environment Variables Updated**

#### Frontend (`/frontend/.env.local`):
```env
# Backend API URL (new custom domain)
VITE_API_URL=https://api.loanpaymentsystem.xyz

# Frontend Domain Configuration
VITE_FRONTEND_URL=https://pay.loanpaymentsystem.xyz
```

#### Backend (`/backend/.env.local`):
```env
# Frontend URL (new custom domain)
APP_BASE_URL=https://pay.loanpaymentsystem.xyz

# Backend API Domain
API_BASE_URL=https://api.loanpaymentsystem.xyz
```

### 2. **CORS Configuration Updated**

**File:** `/backend/src/index.ts`

```typescript
const allowedOrigins = [
    process.env.APP_BASE_URL,
    // New domains
    "https://pay.loanpaymentsystem.xyz",
    "https://www.pay.loanpaymentsystem.xyz",
    // Legacy domains (keep for transition)
    "https://negoman.com",
    "https://www.negoman.com",
    // Local development
    "http://localhost:5173",
    "http://localhost:3000"
].filter(Boolean);
```

### 3. **Fallback API URLs Updated**

Updated in all frontend components:
- `DashboardPage.tsx`
- `PaymentGenerator.tsx`
- `PayPage.tsx`
- `LoginPage.tsx`
- `UserManagement.tsx`

**Old:** `"https://api.negoman.com"`
**New:** `"https://api.loanpaymentsystem.xyz"`

---

## 🚀 **Deployment Configuration**

### **Frontend Vercel Configuration** (`/frontend/vercel.json`):

```json
{
  "version": 2,
  "name": "upi-gateway-frontend",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://api.loanpaymentsystem.xyz",
    "VITE_FRONTEND_URL": "https://pay.loanpaymentsystem.xyz"
  },
  "rewrites": [
    {
      "source": "/pay/([^/]+)",
      "destination": "/pay/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **Backend Vercel Configuration** (`/backend/vercel.json`):

```json
{
  "version": 2,
  "name": "upi-gateway-backend",
  "env": {
    "APP_BASE_URL": "https://pay.loanpaymentsystem.xyz",
    "API_BASE_URL": "https://api.loanpaymentsystem.xyz"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://pay.loanpaymentsystem.xyz"
        }
      ]
    }
  ]
}
```

---

## 🔧 **DNS Configuration Required**

To make these domains work, you need to configure DNS records:

### **For Frontend Domain (`pay.loanpaymentsystem.xyz`)**:
```dns
Type: CNAME
Name: pay
Value: cname.vercel-dns.com
TTL: 3600
```

### **For WWW Frontend (`www.pay.loanpaymentsystem.xyz`)**:
```dns
Type: CNAME
Name: www.pay
Value: cname.vercel-dns.com
TTL: 3600
```

### **For Backend API (`api.loanpaymentsystem.xyz`)**:
```dns
Type: CNAME
Name: api
Value: cname.vercel-dns.com
TTL: 3600
```

### **For WWW API (`www.api.loanpaymentsystem.xyz`)**:
```dns
Type: CNAME
Name: www.api
Value: cname.vercel-dns.com
TTL: 3600
```

---

## 📱 **Deployment Steps**

### **1. Frontend Deployment**

```bash
cd frontend
npm install
npm run build

# Deploy to Vercel
vercel --prod
```

**Configure Domain in Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Domains"
3. Add custom domains:
   - `pay.loanpaymentsystem.xyz`
   - `www.pay.loanpaymentsystem.xyz`

### **2. Backend Deployment**

```bash
cd backend
npm install
npm run build

# Deploy to Vercel
vercel --prod
```

**Configure Domain in Vercel Dashboard:**
1. Go to your project settings
2. Navigate to "Domains"
3. Add custom domains:
   - `api.loanpaymentsystem.xyz`
   - `www.api.loanpaymentsystem.xyz`

### **3. Environment Variables**

**Set in Vercel Dashboard for Frontend:**
```env
VITE_API_URL=https://api.loanpaymentsystem.xyz
VITE_FRONTEND_URL=https://pay.loanpaymentsystem.xyz
```

**Set in Vercel Dashboard for Backend:**
```env
MONGO_URI=mongodb+srv://[your-connection-string]
JWT_SECRET=[your-jwt-secret]
APP_BASE_URL=https://pay.loanpaymentsystem.xyz
API_BASE_URL=https://api.loanpaymentsystem.xyz
```

---

## 🧪 **Testing the Configuration**

### **1. Local Testing**
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

### **2. Production Testing**

**Frontend URLs to Test:**
- `https://pay.loanpaymentsystem.xyz` - Main app
- `https://pay.loanpaymentsystem.xyz/login` - Login page
- `https://pay.loanpaymentsystem.xyz/pay/[order-id]` - Payment page

**Backend URLs to Test:**
- `https://api.loanpaymentsystem.xyz` - API status
- `https://api.loanpaymentsystem.xyz/api/auth/login` - Login endpoint
- `https://api.loanpaymentsystem.xyz/api/orders` - Orders endpoint

---

## 🔄 **Migration Strategy**

### **Phase 1: Parallel Running (Recommended)**
- Keep old domains operational: `negoman.com` / `api.negoman.com`
- Deploy new domains: `pay.loanpaymentsystem.xyz` / `api.loanpaymentsystem.xyz`
- Both systems work simultaneously

### **Phase 2: Traffic Transition**
- Update DNS to point new domains to Vercel
- Test all functionality on new domains
- Monitor for any issues

### **Phase 3: Legacy Cleanup**
- After confirming new domains work perfectly
- Update any external references
- Can optionally remove old domain support

---

## 🛡️ **Security Considerations**

### **SSL/TLS Certificates**
- Vercel automatically provides SSL certificates for custom domains
- Certificates auto-renew every 3 months
- All traffic is encrypted (HTTPS only)

### **CORS Security**
- Updated CORS configuration prevents unauthorized access
- Only specified domains can make API requests
- Credentials are properly handled

### **Environment Security**
- Sensitive data stored in environment variables
- No secrets committed to code repository
- Production and development environments separated

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**

**1. Domain Not Resolving**
- Check DNS configuration
- Wait 24-48 hours for propagation
- Verify CNAME records are correct

**2. CORS Errors**
- Ensure frontend domain is in CORS allowlist
- Check environment variables are set
- Verify API URL format

**3. API Connection Failed**
- Confirm backend is deployed and running
- Check API URL in frontend environment
- Verify network connectivity

### **Monitoring Commands:**

```bash
# Check DNS resolution
nslookup pay.loanpaymentsystem.xyz
nslookup api.loanpaymentsystem.xyz

# Test API connectivity
curl https://api.loanpaymentsystem.xyz
curl https://api.loanpaymentsystem.xyz/api/auth/login

# Check SSL certificate
openssl s_client -connect pay.loanpaymentsystem.xyz:443
```

---

## 📝 **Summary**

✅ **Completed Configuration:**
- Environment variables updated for both frontend and backend
- CORS settings configured for new domains
- Deployment configurations created for Vercel
- All API endpoint references updated throughout codebase
- DNS setup instructions provided
- Migration strategy documented

🎯 **Next Steps:**
1. Configure DNS records with your domain provider
2. Deploy to Vercel with new domain configuration
3. Test all functionality on new domains
4. Update any external references to use new domains

---

*This configuration supports both old and new domains during transition period for zero-downtime migration.*