# Client Setup Guide

## For Team Members (Colleagues)

### Step 1: Install Dependencies
```bash
cd client
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `client` directory with your Railway backend URL:

```env
# Backend API URL (Railway deployment)
EXPO_PUBLIC_API_URL=https://YOUR_RAILWAY_URL.up.railway.app/api

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://tjfwllmnisrkaqnyspoi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZndsbG1uaXNya2FxbnlzcG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjA0NDIsImV4cCI6MjA4MDA5NjQ0Mn0.CuYVpZ9SWxUSO8XfBu22atLgpsWnG8rfwU4hnvjri7Y
```

**Important:** Replace `YOUR_RAILWAY_URL` with the actual Railway backend URL.

### Step 3: Find Your Railway Backend URL

1. Go to [Railway Dashboard](https://railway.app)
2. Select your TowMe backend project
3. Go to **Settings** → **Networking**
4. Copy the **Public Domain** URL (e.g., `towme-backend-production.up.railway.app`)
5. Use it in the `.env` file as: `https://towme-backend-production.up.railway.app/api`

### Step 4: Start the App

```bash
npx expo start
```

Scan the QR code with Expo Go app on your phone.

## Troubleshooting

### Login/Signup Not Working

1. **Check Railway Backend is Running**
   - Visit your Railway dashboard
   - Ensure the backend service is deployed and running
   - Check logs for any errors

2. **Verify API URL**
   - Make sure `.env` file has the correct Railway URL
   - The URL should start with `https://` (not `http://`)
   - The URL should end with `/api`

3. **Check CORS Configuration**
   - Railway backend should have `CORS_ORIGIN=*` or include your app's origin
   - Check Railway environment variables

4. **Test Backend Connection**
   - Open browser and visit: `https://YOUR_RAILWAY_URL/api/health`
   - Should return: `{"success":true,"message":"TowMe API is running",...}`

5. **Clear Expo Cache**
   ```bash
   npx expo start --clear
   ```

### Common Errors

- **"Request timed out"** → Backend URL is wrong or backend is down
- **"Network error"** → Check internet connection or Railway status
- **"CORS error"** → Backend CORS_ORIGIN needs to be updated in Railway
