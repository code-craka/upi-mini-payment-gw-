# UPI Mini Gateway - Vercel Deployment Setup Guide

## 🚨 Current Issue: Login Failure on Vercel

The "invalid credentials" error is occurring because of missing environment variables on Vercel. Here's how to fix it:

## 🔧 Step-by-Step Fix

### 1. Set Up MongoDB Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a cluster (if you don't have one)
3. Create a database user with read/write permissions
4. Get your connection string (it should look like this):

   ```
   mongodb+srv://username:password@cluster.mongodb.net/upi_gateway?retryWrites=true&w=majority
   ```

### 2. Configure Backend Environment Variables on Vercel

Go to your backend project on Vercel Dashboard and add these environment variables:

```bash
# Database Connection
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/upi_gateway?retryWrites=true&w=majority

# JWT Secret (IMPORTANT: Use a strong secret)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-for-security

# Frontend URL (replace with your frontend Vercel URL)
APP_BASE_URL=https://your-frontend-app.vercel.app
```

### 3. Configure Frontend Environment Variables on Vercel

Go to your frontend project on Vercel Dashboard and add:

```bash
# Backend API URL (replace with your backend Vercel URL)
VITE_API_URL=https://your-backend-app.vercel.app
```

### 4. Create Superadmin User

After setting up environment variables, you need to create the initial superadmin user.

#### Option A: Run locally first (Recommended)

```bash
cd backend
npm install
npm run create-admin
```

#### Option B: Add a temporary endpoint (Remove after use)
Add this to your `backend/src/routes/auth.ts`:

```typescript
// TEMPORARY: Remove after creating superadmin
router.post("/create-superadmin", async (req: Request, res: Response) => {
    try {
        const existingAdmin = await User.findOne({ username: "superadmin" });
        if (existingAdmin) {
            return res.status(400).json({ message: "Superadmin already exists" });
        }
        
        await User.create({
            username: "superadmin",
            password: "admin123", // Change this!
            role: "admin"
        });
        
        return res.json({ message: "Superadmin created successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
});
```

Then call this endpoint once: `POST https://your-backend.vercel.app/api/auth/create-superadmin`

**⚠️ IMPORTANT: Remove this endpoint after use for security!**

### 5. Test the Fix

1. Deploy both frontend and backend to Vercel
2. Try logging in with:
   - Username: `superadmin`
   - Password: `admin123`

## 🔐 Security Checklist

- [ ] Strong MongoDB password
- [ ] JWT_SECRET is at least 32 characters long
- [ ] Database user has minimal required permissions
- [ ] Remove temporary endpoints after use
- [ ] Change default superadmin password after first login

## 🚀 Deployment Commands

### Backend:

```bash
cd backend
npm install
npm run build
# Deploy to Vercel
```

### Frontend:

```bash
cd frontend
npm install  
npm run build
# Deploy to Vercel
```

## 🐛 Common Issues & Solutions

### Issue: Still getting "invalid credentials"

- **Solution**: Check Vercel function logs for detailed errors
- **Check**: Ensure MONGO_URI is correctly set with proper credentials

### Issue: CORS errors

- **Solution**: Make sure APP_BASE_URL matches your frontend domain exactly

### Issue: JWT errors  

- **Solution**: Ensure JWT_SECRET is set and is at least 32 characters long

### Issue: Database connection timeout

- **Solution**: Check MongoDB Atlas network access settings (allow 0.0.0.0/0 for Vercel)

## 📱 Testing Locally

Create `.env` files for local testing:

**Backend `.env`:**

```bash
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
APP_BASE_URL=http://localhost:5173
```

**Frontend `.env`:**

```bash
VITE_API_URL=http://localhost:3000
```

Run locally:

```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)  
cd frontend && npm run dev
```

## 🎯 After Setup

1. Login as superadmin
2. Create additional admin/user accounts through the dashboard
3. Change the superadmin password
4. Test payment link generation
5. Test payment flow

---

**Need Help?** Check Vercel function logs at: `https://vercel.com/dashboard` → Your Project → Functions → View Function Logs