# Client Setup Guide

## Quick Start for New Developers

### Step 1: Install Dependencies

```bash
cd client
npm install
```

### Step 2: Configure API URL

**⚠️ CRITICAL: You must set up your API URL or login/register won't work!**

1. **Get the Railway backend URL from your team lead**
   - Format: `https://your-backend.railway.app`
   - Ask for the exact URL

2. **Create `.env` file in the `client/` directory:**
   ```bash
   cd client
   cp .env.example .env
   ```

3. **Edit `.env` and add the Railway URL:**
   ```bash
   EXPO_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```
   
   **Important:** The URL must end with `/api`

4. **Verify `.env` file exists:**
   ```bash
   # Should show your .env file
   ls -la client/.env
   ```

### Step 3: Start Development Server

```bash
# From client/ directory
npx expo start -c
```

The `-c` flag clears the cache, which is important after setting environment variables.

### Step 4: Verify Configuration

When Expo starts, check the console logs. You should see:

```
🔗 API Base URL: https://your-backend.railway.app/api
```

**❌ If you see this instead:**
```
🔗 API Base URL: http://172.20.10.3:3001/api
```

**Then your `.env` file isn't loading. Try:**
1. Make sure `.env` is in the `client/` directory (not root)
2. Restart Expo completely (stop with Ctrl+C, then start again)
3. Clear cache: `npx expo start -c`

## Troubleshooting

### "Cannot connect to server" or "Network request failed"

1. **Check if `.env` file exists** in `client/` directory
2. **Verify the URL format** - must end with `/api`
3. **Check Railway backend is running** - ask team lead
4. **Restart Expo** after creating `.env` file

### Login/Register not working

- **Most common cause**: Missing or incorrect `.env` file
- **Solution**: Follow Step 2 above
- **Verify**: Check console logs show Railway URL, not local IP

### Still having issues?

1. Check `client/API_CONFIGURATION.md` for detailed troubleshooting
2. Ask your team lead for the Railway backend URL
3. Verify Railway service is running and accessible

