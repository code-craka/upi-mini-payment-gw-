# Blank Screen Fix Guide

## Issue Summary

The local development server shows a blank UI with no content displayed.

## Root Cause Analysis

### Fixed Issues ✅

1. **TypeScript Build Errors** - All type import errors have been fixed
   - Changed imports to use `type` keyword for type-only imports
   - Removed unused React imports from functional components
   - Removed unused variables (like `index` in MerchantDashboard)

### Build Status

- ✅ Frontend builds successfully (`npm run build` works)
- ✅ Vite dev server starts on port 5173
- ⚠️  Need to verify actual browser rendering

## Step-by-Step Fix Instructions

### 1. Start Backend Server (Required for API calls)

```bash
cd backend
npm run dev
```

This should show:
```
🚀 Server running on port 3000
📊 Sentry enabled: true
```

### 2. Start Frontend Server

In a **new terminal**:

```bash
cd frontend
npm run dev
```

This should show:
```
VITE v7.1.4  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 3. Check Browser Console

Open your browser to `http://localhost:5173/` and check:

1. **Open DevTools** (F12 or Cmd+Option+I)
2. **Check Console tab** for errors
3. **Check Network tab** to see if assets are loading

### Common Issues & Solutions

#### Issue: White/Blank Screen with No Console Errors

**Possible Cause**: Sentry initialization blocking

**Solution**: Check if Sentry DSN is valid in `.env.local`:

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:3000
VITE_SENTRY_DSN=your_sentry_dsn_here
```

If you don't want Sentry, you can temporarily comment it out in `frontend/src/main.tsx`:

```tsx
// import './instrument.ts';  // Comment this out temporarily
```

#### Issue: CORS Errors in Console

**Solution**: Ensure backend `.env.local` has:

```bash
# backend/.env.local
APP_BASE_URL=http://localhost:5173
```

#### Issue: API Connection Errors

**Symptoms**: Console shows "Network Error" or "ERR_CONNECTION_REFUSED"

**Solution**: 
1. Verify backend is running on port 3000
2. Check `frontend/.env.local` has: `VITE_API_URL=http://localhost:3000`

#### Issue: Router Not Working (404 on all pages)

**Symptoms**: Blank screen, console shows "No routes matched"

**Solution**: This is already fixed - `App.tsx` has proper routing setup.

#### Issue: Build Errors Preventing Dev Server

**Status**: ✅ FIXED - All TypeScript errors resolved

The following files were updated:
- `frontend/src/components/rbac/PermissionGate.tsx`
- `frontend/src/components/rbac/ProtectedRoute.tsx`
- `frontend/src/components/rbac/RoleBadge.tsx`
- `frontend/src/components/rbac/UserHierarchy.tsx`
- `frontend/src/components/user-management/UserCard.tsx`
- `frontend/src/components/user-management/UserCreateForm.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/dashboards/MerchantDashboard.tsx`

### 4. Test with Backend Running

The frontend requires backend API for:
- User authentication (login)
- Payment link generation
- Order management
- Dashboard data

**Without backend running**, you'll see:
- Login page (should work)
- But login will fail with network error

**With backend running**, you should see:
- Login page → Can login successfully
- After login → See payment generator page
- Navigation working properly

## Quick Test Checklist

Run these commands in order:

```bash
# 1. Clean build
cd frontend
rm -rf node_modules/.vite
npm run build

# 2. Start backend
cd ../backend
npm run dev
# Keep this terminal open

# 3. Start frontend (new terminal)
cd ../frontend
npm run dev
# Keep this terminal open

# 4. Open browser
open http://localhost:5173
```

## Expected Behavior

When everything works correctly:

1. **Home Page** (`/`): Shows the Payment Generator form
2. **Login Page** (`/login`): Shows login form (redirects here if not authenticated)
3. **After Login**: Should see the payment generator with navigation
4. **Navigation**: Should show based on user role
   - User: Home, Orders, Logout
   - Merchant: Home, Dashboard, Users, Orders, Logout
   - Superadmin: All options

## Debugging Steps

If you still see a blank screen:

### 1. Check HTML is Loading

```bash
curl -s http://localhost:5173/ | grep -i "<!doctype"
```

Should output: `<!doctype html>`

### 2. Check JavaScript is Loading

Open DevTools → Network tab → Filter by "JS" → Should see `main.tsx` or similar

### 3. Check React is Mounting

In browser console, type:
```javascript
document.getElementById('root')
```

Should show a div element, not null.

### 4. Check for React Errors

Look for red error messages in console about:
- "Uncaught Error"
- "Failed to compile"
- "Module not found"

### 5. Verify Environment Variables

```bash
cd frontend
cat .env.local
```

Should have:
```
VITE_API_URL=http://localhost:3000
VITE_SENTRY_DSN=<your_dsn>
```

## Nuclear Option: Complete Reset

If nothing works:

```bash
# 1. Stop all processes
pkill -f "vite"
pkill -f "ts-node"

# 2. Clean everything
cd frontend
rm -rf node_modules dist .vite
npm install

cd ../backend
rm -rf node_modules dist
npm install

# 3. Rebuild
cd ../frontend
npm run build

# 4. Start fresh
cd ../backend
npm run dev
# New terminal:
cd ../frontend  
npm run dev
```

## Still Having Issues?

Please provide:

1. **Backend terminal output** (first 20 lines)
2. **Frontend terminal output** (first 20 lines)
3. **Browser console errors** (screenshot or copy text)
4. **Network tab** showing failed requests (if any)

## Fixed TypeScript Errors

All these errors have been resolved:

- ✅ `PermissionGateProps` - Using type-only import
- ✅ `UserRole` - Using type-only import
- ✅ `ProtectedRouteProps` - Using type-only import
- ✅ `RoleBadgeProps` - Using type-only import
- ✅ `User` type - Using type-only import
- ✅ Unused React imports - Removed
- ✅ Unused `index` variable - Removed
- ✅ Build now completes successfully

The project is now ready to run locally!