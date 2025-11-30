# TowMe 🚛

A roadside assistance and towing request mobile application for Ghana built with React Native/Expo and Express.js.

## 📱 Features

- **Vehicle Owners**: Request towing services, track operators in real-time, rate services
- **Tow Operators**: Accept requests, manage jobs, track earnings
- **Real-time Tracking**: Live location updates during active trips
- **Smart Pricing**: Distance-based pricing with vehicle type multipliers
- **Rating System**: Two-way ratings for quality assurance

## 🏗️ Project Structure

```
TowMe/
├── app/                    # React Native/Expo frontend
│   ├── (tabs)/            # Tab navigation screens
│   └── screens/           # Feature screens (auth, user, operator)
├── backend/               # Express.js API server
│   ├── src/               # TypeScript source code
│   └── database/          # SQL schema files
├── lib/                   # Shared libraries
│   └── api/               # API client for frontend
└── components/            # Reusable UI components
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account ([supabase.com](https://supabase.com))
- Expo CLI (`npm install -g expo-cli`)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start the app
npx expo start
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Set up database (run schema.sql in Supabase SQL Editor)

# Seed demo data (optional)
npm run seed

# Start server
npm run dev
```

See [backend/README.md](./backend/README.md) for detailed backend documentation.

## 💰 Pricing

| Vehicle Type | Multiplier |
|-------------|------------|
| Motorcycle | 0.7x |
| Car | 1.0x |
| Saloon | 1.1x |
| SUV | 1.3x |
| Van | 1.5x |
| Others | 1.8x |
| Truck | 2.0x |

- **Base Rate**: GH₵15/km
- **Minimum Fare**: GH₵50

## 📚 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | User registration |
| `POST /api/auth/login` | User login |
| `GET /api/requests` | Get towing requests |
| `POST /api/requests` | Create new request |
| `GET /api/pricing/estimate` | Get price estimate |

Full API documentation in [backend/README.md](./backend/README.md).

## 🔒 Security

- JWT authentication (24h expiry)
- bcrypt password hashing
- Rate limiting (100 auth / 1000 general requests per 15 min)
- Row Level Security (RLS) in Supabase
- Helmet.js HTTP security headers

## 🛠️ Tech Stack

**Frontend:**
- React Native + Expo
- TypeScript
- NativeWind (Tailwind CSS)
- React Hook Form + Zod

**Backend:**
- Express.js + TypeScript
- Supabase (PostgreSQL)
- JWT Authentication
- Pino Logger

## 📄 License

ISC

---

Built with ❤️ for Ghana 🇬🇭
