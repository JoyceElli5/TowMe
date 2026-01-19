# Troubleshooting Guide - Registration "Failed to create user" Error

## Issues Found and Fixed

### 1. ✅ Missing Database Tables
**Problem:** The `email_verification_tokens` and `password_reset_tokens` tables were missing from `schema.sql`

**Fix:** Added these tables to `schema.sql`. You need to run this SQL in your Supabase database:

```sql
-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
```

### 2. ✅ Improved Error Handling
- Backend now shows actual Supabase error messages (in development)
- Better error codes handling (unique violations, foreign keys, etc.)
- More detailed logging

### 3. ✅ Made Token Storage Non-Blocking
- Registration won't fail if verification token storage fails
- User will still be created even if email verification token can't be stored

## Critical Checks for Render Deployment

### Required Environment Variables on Render:

```bash
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ CRITICAL - Must be set!

# JWT (REQUIRED)
JWT_SECRET=your-secret-min-32-chars

# Server (Auto-set by Render)
PORT=10000
NODE_ENV=production

# CORS (Optional - defaults to allow all)
CORS_ORIGIN=*
```

### ⚠️ Most Common Issue: Missing SUPABASE_SERVICE_ROLE_KEY

If `SUPABASE_SERVICE_ROLE_KEY` is not set, the backend cannot:
- Create users (registration will fail)
- Bypass Row Level Security (RLS)
- Perform admin operations

**How to get it:**
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy the "service_role" key (NOT the anon key)
4. Add it to Render environment variables

## Database Setup Checklist

1. ✅ Run `schema.sql` in Supabase SQL Editor
2. ✅ Verify tables exist:
   - `users`
   - `email_verification_tokens` ← **Check this!**
   - `password_reset_tokens` ← **Check this!**
   - `towing_requests`
   - `ratings`
   - etc.

3. ✅ Verify RLS policies:
   - Service role should bypass RLS automatically
   - If issues persist, you may need to add an INSERT policy for service role

## Testing Registration

After fixing the above:

1. **Check Render logs** for detailed error messages
2. **Test the API directly:**
   ```bash
   curl -X POST https://your-backend.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "fullName": "Test User",
       "phone": "0241234567",
       "role": "vehicle_owner"
     }'
   ```

3. **Check the response** - it should now show the actual error if something is wrong

## Next Steps

1. **Add missing tables** to your Supabase database (run the SQL above)
2. **Verify SUPABASE_SERVICE_ROLE_KEY** is set in Render
3. **Redeploy** your backend on Render
4. **Test registration** again

The improved error handling will now show you the exact error if something is still wrong.

