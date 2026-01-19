# API Configuration Guide

## Environment Variables

### Required for Client (.env or app.json)

```bash
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

**Important Notes:**
1. The URL **must end with `/api`** (e.g., `https://towme-backend.onrender.com/api`)
2. For Expo, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the client
3. After setting the variable, restart your Expo development server

### Setting Environment Variables

#### Option 1: Using .env file (Recommended)
Create a `.env` file in the `client/` directory:

```bash
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

Then restart Expo:
```bash
npm start
```

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

## Backend Configuration (Render)

### Required Environment Variables on Render:

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

### Issue: "Cannot connect to server"
1. **Check the API URL format**: Must end with `/api`
2. **Verify Render service is running**: Check Render dashboard
3. **Check CORS configuration**: Ensure `CORS_ORIGIN` allows your client origin
4. **Verify environment variable**: Restart Expo after setting `EXPO_PUBLIC_API_URL`

### Issue: CORS errors
- Set `CORS_ORIGIN=*` in Render environment variables (for development)
- Or specify exact origins: `CORS_ORIGIN=http://localhost:8081,exp://...`

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

## Common Render URLs Format

Render URLs typically look like:
- `https://towme-backend-xyz.onrender.com`

Your `EXPO_PUBLIC_API_URL` should be:
- `https://towme-backend-xyz.onrender.com/api`

Note: Render automatically handles HTTPS and the `/api` path is added by your Express routes.

