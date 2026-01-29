# TowMe Client

Mobile application built with Expo and React Native.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Railway backend URL
   EXPO_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```

3. **Start development server:**
   ```bash
   npx expo start -c
   ```

## 📚 Documentation

- **Setup Guide**: See `SETUP.md` for detailed setup instructions
- **API Configuration**: See `API_CONFIGURATION.md` for API setup
- **Network Troubleshooting**: See `NETWORK_TROUBLESHOOTING.md` for connection issues

## ⚠️ Important Notes

- **Every developer must create their own `.env` file** - it's gitignored
- **The `.env` file must be in the `client/` directory**
- **After creating/editing `.env`, restart Expo completely**
- **The API URL must end with `/api`**

## 🔧 Environment Variables

Required:
- `EXPO_PUBLIC_API_URL` - Your Railway backend URL (must end with `/api`)

Example:
```bash
EXPO_PUBLIC_API_URL=https://towme-backend-production.up.railway.app/api
```

