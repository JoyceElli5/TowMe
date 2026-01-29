# Railway Backend Setup Guide

## Environment Variables Required in Railway

Make sure these environment variables are set in your Railway backend project:

### Required Variables

1. **SUPABASE_URL**
   - Value: `https://tjfwllmnisrkaqnyspoi.supabase.co`

2. **SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZndsbG1uaXNya2FxbnlzcG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjA0NDIsImV4cCI6MjA4MDA5NjQ0Mn0.CuYVpZ9SWxUSO8XfBu22atLgpsWnG8rfwU4hnvjri7Y`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (from Supabase dashboard)

4. **JWT_SECRET**
   - Value: A secure random string (minimum 32 characters)
   - Example: `towme_jwt_secret_key_2024_secure_min_32_characters_long_required`

5. **JWT_EXPIRES_IN**
   - Value: `24h`

6. **JWT_REFRESH_EXPIRES_IN**
   - Value: `7d`

7. **PORT**
   - Value: Railway will set this automatically (usually `3000` or `PORT` env var)

8. **NODE_ENV**
   - Value: `production`

9. **CORS_ORIGIN** (IMPORTANT!)
   - Value: `*` (allows all origins, including mobile apps)
   - Or specific origins: `exp://localhost:8081,exp://192.168.1.100:8081`

### How to Set Environment Variables in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your TowMe backend project
3. Click on **Variables** tab
4. Add each variable listed above
5. Click **Deploy** to apply changes

## Getting Your Railway Backend URL

1. Go to Railway Dashboard
2. Select your backend project
3. Go to **Settings** → **Networking**
4. Under **Public Domain**, copy the URL (e.g., `towme-backend-production.up.railway.app`)
5. Use this URL in your client `.env` file as: `https://towme-backend-production.up.railway.app/api`

## Testing Your Railway Backend

After deployment, test your backend:

```bash
# Health check
curl https://YOUR_RAILWAY_URL/api/health

# Should return:
# {"success":true,"message":"TowMe API is running",...}
```

## Troubleshooting

### Backend Not Responding
- Check Railway logs for errors
- Verify all environment variables are set correctly
- Ensure the service is deployed and running

### CORS Errors
- Make sure `CORS_ORIGIN=*` is set in Railway
- Or add specific mobile app origins

### Database Connection Issues
- Verify Supabase credentials are correct
- Check Supabase project is active
- Ensure database schema is created
