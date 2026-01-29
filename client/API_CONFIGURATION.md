# API Configuration Guide

## ⚠️ IMPORTANT: Each Developer Must Configure Their Own API URL

**The backend is hosted on Railway, but each developer needs to set their own `EXPO_PUBLIC_API_URL` locally.**

## Environment Variables

### Required for Client (.env file)

**Every developer must create their own `.env` file in the `client/` directory:**

```bash
EXPO_PUBLIC_API_URL=https://your-backend.railway.app/api
```

**Important Notes:**
1. The URL **must end with `/api`** (e.g., `https://towme-backend-production.up.railway.app/api`)
2. For Expo, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the client
3. After setting the variable, **restart your Expo development server completely**
4. The `.env` file is gitignored, so each developer creates their own

### Quick Setup Steps

1. **Get the Railway backend URL:**
   - Ask your team lead for the Railway backend URL
   - Or check Railway Dashboard → Your Service → Settings → Domains
   - Format: `https://your-service-name.up.railway.app`

2. **Create `.env` file in `client/` directory:**
   ```bash
   cd client
   cp .env.example .env
   ```

3. **Edit `.env` and add your Railway URL:**
   ```bash
   EXPO_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```

4. **Restart Expo:**
   ```bash
   # Stop Expo (Ctrl+C)
   # Clear cache and restart
   npx expo start -c
   ```

5. **Verify it's working:**
   - Check console logs when Expo starts
   - You should see: `🔗 API Base URL: https://your-backend.railway.app/api`
   - If you see the local IP (`172.20.10.3`), the environment variable isn't loading

#### Option 2: Using app.json (For Expo)
Add to your `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-backend.onrender.com/api"
    }
  }
}
```

Then access via: `process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl`

## Backend Configuration (Railway)

### Required Environment Variables on Railway:

```bash
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# CORS (Optional - defaults to allow all)
CORS_ORIGIN=*
# Or specify specific origins:
# CORS_ORIGIN=http://localhost:8081,exp://192.168.1.1:8081

# Server
PORT=10000  # Render sets this automatically
NODE_ENV=production
```

## Troubleshooting

### Issue: "Cannot connect to server" or "Network request failed"
1. **Check if `.env` file exists**: Must be in `client/` directory
2. **Check the API URL format**: Must end with `/api`
3. **Verify Railway service is running**: Check Railway dashboard
4. **Check CORS configuration**: Ensure `CORS_ORIGIN` allows your client origin on Railway
5. **Verify environment variable**: Restart Expo completely after setting `EXPO_PUBLIC_API_URL`
6. **Check console logs**: Look for `🔗 API Base URL:` - if it shows local IP, env var isn't loading

### Issue: CORS errors
- Set `CORS_ORIGIN=*` in Railway environment variables (for development)
- Or specify exact origins: `CORS_ORIGIN=http://localhost:8081,exp://...`

### Issue: Login/Register not working for colleague
- **Most common cause**: Colleague doesn't have `.env` file set up
- **Solution**: Have them create `client/.env` with `EXPO_PUBLIC_API_URL=https://your-backend.railway.app/api`
- **Verify**: Check their console logs - should show Railway URL, not local IP

### Issue: 404 Not Found
- Ensure the URL ends with `/api`
- Check that routes are mounted at `/api` in backend

### Testing API Connection

Use the helper function:
```typescript
import { checkApiConnection } from '@/lib/api';

const isConnected = await checkApiConnection();
console.log('API Connected:', isConnected);
```

## Common Railway URLs Format

Railway URLs typically look like:
- `https://towme-backend-production.up.railway.app`
- `https://towme-backend-production.railway.app`

Your `EXPO_PUBLIC_API_URL` should be:
- `https://towme-backend-production.up.railway.app/api`

**Note:** 
- Railway automatically handles HTTPS
- The `/api` path is added by your Express routes
- Get the exact URL from Railway Dashboard → Your Service → Settings → Domains

