# Network Troubleshooting Guide

## Error: "Network request failed" (Status 0)

This error means the request never reached the server. Here's how to fix it:

### Step 1: Check Your API URL

The app is currently trying to connect to:
- **Default (if not set)**: `http://172.20.10.3:3001/api`
- **Your Render URL**: `https://your-backend.onrender.com/api`

### Step 2: Set the Correct API URL

#### Option A: Using .env file (Recommended)

1. Create a `.env` file in the `client/` directory:
```bash
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

2. **Restart Expo completely**:
   - Stop Expo (Ctrl+C)
   - Clear cache: `npx expo start -c`
   - Or restart: `npm start`

#### Option B: Using app.json

1. Open `client/app.json` (or root `app.json`)
2. Add to `expo.extra`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-backend.onrender.com/api"
    }
  }
}
```

3. Update `client/lib/api/client.ts`:
```typescript
import Constants from 'expo-constants';

export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.apiUrl || 
  'http://172.20.10.3:3001/api';
```

### Step 3: Verify Your Render Backend

1. **Check Render Dashboard**:
   - Is your service running? (Status should be "Live")
   - Copy the service URL (e.g., `https://towme-backend-xyz.onrender.com`)

2. **Test the API directly**:
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Or open in browser: `https://your-backend.onrender.com/api/health`

3. **Check CORS settings**:
   - In Render environment variables, ensure:
     ```
     CORS_ORIGIN=*
     ```

### Step 4: Common Issues

#### Issue: Using HTTP instead of HTTPS
- ❌ Wrong: `http://your-backend.onrender.com/api`
- ✅ Correct: `https://your-backend.onrender.com/api`
- **Render always uses HTTPS**, so use `https://`

#### Issue: Missing `/api` suffix
- ❌ Wrong: `https://your-backend.onrender.com`
- ✅ Correct: `https://your-backend.onrender.com/api`

#### Issue: Environment variable not loading
- **Expo requires restart** after setting environment variables
- Use `EXPO_PUBLIC_` prefix for client-side variables
- Clear cache: `npx expo start -c`

#### Issue: Local IP address not accessible
- If using local IP (`172.20.10.3`), ensure:
  - Phone/emulator is on the same network
  - Backend is running locally
  - Firewall allows connections on port 3001

### Step 5: Debug Steps

1. **Check what URL is being used**:
   - Look at console logs when app starts
   - Should see: `🔗 API Base URL: https://...`

2. **Test connection**:
   - The app now checks connection before registration
   - If connection fails, you'll see a detailed error message

3. **Check Render logs**:
   - Go to Render dashboard → Your service → Logs
   - See if requests are reaching the server

### Quick Fix Checklist

- [ ] Set `EXPO_PUBLIC_API_URL` in `.env` file
- [ ] Use HTTPS (not HTTP) for Render URL
- [ ] Include `/api` at the end of URL
- [ ] Restart Expo after setting environment variable
- [ ] Verify Render service is running
- [ ] Check CORS is set to `*` in Render

### Example .env file

```bash
# client/.env
EXPO_PUBLIC_API_URL=https://towme-backend-xyz.onrender.com/api
```

**Important**: Replace `towme-backend-xyz` with your actual Render service name!

