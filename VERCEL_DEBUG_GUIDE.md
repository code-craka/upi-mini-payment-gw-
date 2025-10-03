# Vercel Deployment Debug Guide

## Current Issue: Login works locally but not on Vercel

### ✅ **What's Working:**
- Backend API: https://api.loanpaymentsystem.xyz/ ✅
- Backend Login: https://api.loanpaymentsystem.xyz/api/auth/login ✅
- Frontend Access: https://pay.loanpaymentsystem.xyz/ ✅

### 🔧 **What We Fixed:**

1. **Root vercel.json**: Removed conflicting project configurations
2. **Frontend vercel.json**: Added proper environment variables in build section
3. **Backend vercel.json**: Added missing Sentry DSN
4. **LoginPage.tsx**: Fixed to use API client instead of direct axios
5. **Error Handling**: Added proper error display

### 🧪 **Testing Steps:**

1. Wait 5-10 minutes for Vercel deployment to complete
2. Clear browser cache for https://pay.loanpaymentsystem.xyz/
3. Try logging in with: `superadmin` / `admin123`

### 🐛 **Manual Testing Commands:**

```bash
# Test backend API directly
curl -X GET https://api.loanpaymentsystem.xyz/

# Test login endpoint
curl -X POST https://api.loanpaymentsystem.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "admin123"}'
```

### 🔍 **If Still Not Working:**

**Check Vercel Environment Variables:**
1. Go to Vercel Dashboard → Your Frontend Project → Settings → Environment Variables
2. Ensure these are set:
   - `VITE_API_URL` = `https://api.loanpaymentsystem.xyz`
   - `VITE_FRONTEND_URL` = `https://pay.loanpaymentsystem.xyz`
   - `VITE_SENTRY_DSN` = Your Sentry DSN
   - `VITE_APP_VERSION` = `1.0.0`

**Browser Console Debugging:**
1. Open https://pay.loanpaymentsystem.xyz/
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try login and check for errors
5. Go to Network tab and see if API calls are being made

### 🚨 **Common Issues:**

1. **CORS Error**: Check if backend allows frontend domain
2. **Environment Variables**: Frontend doesn't have VITE_API_URL
3. **Build Cache**: Old build cached on Vercel
4. **Network Issues**: Check if API calls reach backend

### 🎯 **Expected Flow:**

1. User enters credentials on https://pay.loanpaymentsystem.xyz/
2. Frontend makes POST to https://api.loanpaymentsystem.xyz/api/auth/login
3. Backend validates and returns JWT token
4. Frontend stores token and redirects to dashboard

### 📝 **Debug Information:**

- **Frontend**: Using apiClient from utils/api.ts
- **Backend**: CORS configured for pay.loanpaymentsystem.xyz
- **JWT Secret**: Properly configured in backend
- **Database**: MongoDB Atlas connected

---

**If you're still having issues after deployment, please:**
1. Check browser console for errors
2. Check Vercel deployment logs
3. Test with different browsers
4. Clear all browser cache/localStorage