# Vercel Environment Variables Setup Guide

## Critical Issue Resolution

Your backend deployment was stuck on an old commit from September 22nd. The new deployment should now use the latest code with proper authentication endpoints.

## Required Environment Variables

### ⚠️ IMPORTANT: Set these in Vercel Dashboard, NOT in vercel.json

### Backend Project Environment Variables
Go to: https://vercel.com/techsci/upi-gateway-backend/settings/environment-variables

Set these for **Production** environment:

```
MONGO_URI=mongodb+srv://rihanawsacc_db_user:YmYoVTUpkL62CnG1@upi-admin-gw-main.eqhavnh.mongodb.net/?retryWrites=true&w=majority&appName=upi-admin-gw-main

JWT_SECRET=7lMSSpjjMbd0pDv74dI40UhW1rpVsUJBEWkWjPCIJzbdrvBucLzWLEsTK1rJwKetBU7447EE/xFvzafSYHUYfQ==

APP_BASE_URL=https://pay.loanpaymentsystem.xyz

API_BASE_URL=https://api.loanpaymentsystem.xyz

SENTRY_DSN=https://2210dd2b22251d8aa99b88692b2bde10@o4507587199369216.ingest.us.sentry.io/4507587213787136
```

### Frontend Project Environment Variables  
Go to: https://vercel.com/techsci/upi-gateway-frontend/settings/environment-variables

Set these for **Production** environment:

```
VITE_API_URL=https://api.loanpaymentsystem.xyz

VITE_FRONTEND_URL=https://pay.loanpaymentsystem.xyz

VITE_SENTRY_DSN=https://2210dd2b22251d8aa99b88692b2bde10@o4507587199369216.ingest.us.sentry.io/4510063524511744

VITE_APP_VERSION=1.0.0
```

## Steps to Fix

1. **Set Environment Variables**: Copy the above variables to your Vercel dashboard
2. **Trigger Redeploy**: Go to your backend project → Deployments → Click "Redeploy" on latest
3. **Wait for Build**: Monitor the build logs for any errors
4. **Test Login**: Try logging in with `superadmin` / `admin123`

## Verification Commands

Test if backend is working after deployment:
```bash
curl https://api.loanpaymentsystem.xyz/

curl -X POST https://api.loanpaymentsystem.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "admin123"}'
```

## Common Issues

- **Environment variables not set**: Login will fail with database connection errors
- **Old deployment cached**: Force redeploy from Vercel dashboard
- **CORS errors**: Check if frontend environment variables are set correctly

## Success Indicators

✅ Backend responds with proper user object structure:
```json
{
  "message": "Login successful",
  "token": "eyJ...",
  "user": {
    "_id": "...",
    "username": "superadmin", 
    "role": "superadmin",
    ...
  }
}
```

✅ Frontend can successfully parse the response and redirect to dashboard