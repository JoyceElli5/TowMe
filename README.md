# TowMe 🚛

A comprehensive roadside assistance and towing request mobile application for Ghana built with React Native/Expo and Express.js. The application connects vehicle owners who need towing services with professional tow operators.

## 📱 Features

### For Vehicle Owners
- **Request Towing**: Enter pickup and destination locations to request a tow
- **Vehicle Selection**: Choose from motorcycle, car, saloon, SUV, van, truck, or other vehicle types
- **Price Estimation**: Get estimated prices based on distance and vehicle type
- **Real-time Tracking**: Track the operator's location during active trips
- **Rating System**: Rate and review tow operators after service completion

### For Tow Operators
- **Online/Offline Status**: Toggle availability to receive requests
- **Incoming Requests**: View and accept/decline towing requests
- **Trip Management**: Navigate to pickup, start towing, and complete trips
- **Earnings Tracking**: View daily earnings and trip statistics
- **Customer Ratings**: Rate vehicle owners and build reputation

### Core Features
- **JWT Authentication**: Secure login and registration with token-based auth
- **Real-time Updates**: Live location tracking during active towing
- **Smart Pricing**: Distance-based pricing with vehicle type multipliers
- **Two-way Ratings**: Both parties can rate each other for quality assurance

## 🏗️ Project Structure

```
TowMe/
├── app/                           # React Native/Expo frontend
│   ├── (tabs)/                    # Tab navigation screens
│   │   └── index.tsx              # Onboarding/landing screen
│   ├── screens/                   # Feature screens
│   │   ├── auth/                  # Authentication screens
│   │   │   ├── login-screen.tsx   # User login
│   │   │   └── register-screen.tsx # User registration
│   │   ├── user/                  # Vehicle owner screens
│   │   │   ├── home-screen.tsx    # Main dashboard with map & request form
│   │   │   ├── searching-operator.tsx
│   │   │   ├── operator-found.tsx
│   │   │   ├── live-tracking.tsx
│   │   │   ├── trip-completed.tsx
│   │   │   └── rating.tsx
│   │   └── operator/              # Tow operator screens
│   │       ├── dashboard.tsx      # Operator main screen
│   │       ├── incoming-request.tsx
│   │       ├── navigation-to-pickup.tsx
│   │       ├── arrived-at-pickup.tsx
│   │       ├── towing-in-progress.tsx
│   │       ├── trip-completed.tsx
│   │       └── rate-user.tsx
│   └── _layout.tsx                # Root layout
├── backend/                       # Express.js API server
│   ├── src/                       # TypeScript source
│   │   ├── config/                # Configuration (database, env)
│   │   ├── controllers/           # Request handlers
│   │   ├── middleware/            # Auth, validation, error handling
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   ├── types/                 # TypeScript types
│   │   ├── utils/                 # Utilities (logger, calculators)
│   │   ├── scripts/               # Seed scripts
│   │   └── server.ts              # Entry point
│   └── database/                  # SQL schema files
│       └── schema.sql             # Database schema
├── lib/                           # Shared libraries
│   └── api/                       # API client for frontend
│       ├── client.ts              # HTTP client with auth
│       ├── auth.ts                # Auth API functions
│       ├── requests.ts            # Towing requests API
│       ├── ratings.ts             # Ratings API
│       ├── users.ts               # Users API
│       └── index.ts               # Module exports
├── components/                    # Reusable UI components
│   ├── address-input-card.tsx
│   ├── price-estimator-card.tsx
│   ├── primary-button.tsx
│   ├── vehicle-type-card.tsx
│   └── ui/                        # Base UI components
├── schemas/                       # Validation schemas
│   └── auth.ts                    # Auth form validation (Zod)
├── constants/                     # App constants
│   └── pricing.ts                 # Pricing configuration
└── hooks/                         # Custom React hooks
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account ([supabase.com](https://supabase.com))
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator (or Expo Go app)

### Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Navigate to **SQL Editor** in your Supabase dashboard
3. Copy and run the contents of `backend/database/schema.sql`

The schema creates the following tables:
- `users` - User accounts (vehicle owners & tow operators)
- `towing_requests` - Towing service requests
- `ratings` - User ratings
- `inspections` - Vehicle inspections before towing
- `operator_locations` - Real-time operator locations
- `notifications` - Push notifications
- `payments` - Payment records

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Edit .env with your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# JWT_SECRET=your_secret_key_min_32_chars
# PORT=3001
# NODE_ENV=development

# (Optional) Seed demo data
npm run seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3001`

### Frontend Setup

```bash
# From root directory, install dependencies
npm install

# Set API URL (create .env file in root)
echo "EXPO_PUBLIC_API_URL=http://localhost:3001/api" > .env

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on your device.

## 🔌 Frontend-Backend Integration

The frontend connects to the backend through a centralized API client located in `lib/api/`. Here's how the integration works:

### API Client (`lib/api/client.ts`)
- Manages HTTP requests with automatic token attachment
- Handles token storage using `expo-secure-store`
- Provides typed responses with error handling

### Authentication Flow
```typescript
// Registration
import { register } from '@/lib/api';

const user = await register({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'Kwame Asante',
  phone: '0241234567',
  role: 'vehicle_owner' // or 'tow_operator'
});

// Login
import { login } from '@/lib/api';

const user = await login({
  email: 'user@example.com',
  password: 'password123'
});
```

### Creating a Towing Request
```typescript
import { createRequest } from '@/lib/api';

const request = await createRequest({
  pickupAddress: 'Ring Road Central, Accra',
  destinationAddress: 'Accra Mall, Accra',
  pickupLat: 5.5500,
  pickupLng: -0.2050,
  destinationLat: 5.6350,
  destinationLng: -0.1650,
  vehicleType: 'suv'
});
```

### Operator Actions
```typescript
import { 
  getPendingRequests, 
  acceptRequest, 
  toggleOperatorOnlineStatus 
} from '@/lib/api';

// Toggle online status
await toggleOperatorOnlineStatus(operatorId, true);

// Get pending requests
const requests = await getPendingRequests();

// Accept a request
await acceptRequest(requestId);
```

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

**Pricing Formula**: `max(distance × 15 × multiplier, 50)`
- **Base Rate**: GH₵15/km
- **Minimum Fare**: GH₵50

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh-token` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id` | Update user profile |
| GET | `/api/users/:id/stats` | Get user statistics |

### Operators
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/operators/:id/online-status` | Toggle online/offline |

### Towing Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create new request |
| GET | `/api/requests` | Get all requests (with filters) |
| GET | `/api/requests/:id` | Get request by ID |
| GET | `/api/requests/pending` | Get pending requests |
| GET | `/api/requests/user/:userId` | Get user's requests |
| GET | `/api/requests/operator/:operatorId` | Get operator's jobs |
| GET | `/api/requests/:id/track` | Track request location |
| PATCH | `/api/requests/:id/accept` | Accept request |
| PATCH | `/api/requests/:id/start` | Start trip |
| PATCH | `/api/requests/:id/complete` | Complete trip |
| PATCH | `/api/requests/:id/cancel` | Cancel request |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ratings` | Submit rating |
| GET | `/api/ratings/user/:userId` | Get user ratings |
| GET | `/api/ratings/stats/:userId` | Get rating statistics |

### Pricing & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pricing/estimate` | Get price estimate |
| POST | `/api/payments` | Process payment |
| GET | `/api/payments/:requestId` | Get payment details |

Full API documentation available in [backend/README.md](./backend/README.md).

## 🔒 Security

- **JWT Authentication**: 24-hour token expiry with refresh tokens
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: 
  - Auth endpoints: 100 requests per 15 minutes
  - General endpoints: 1000 requests per 15 minutes
- **Row Level Security (RLS)**: Database-level access control in Supabase
- **Helmet.js**: HTTP security headers
- **Input Validation**: Zod schemas for request validation
- **Secure Token Storage**: `expo-secure-store` for mobile

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React Native | Mobile app framework |
| Expo | Development & build tooling |
| TypeScript | Type safety |
| NativeWind | Tailwind CSS for React Native |
| React Hook Form | Form management |
| Zod | Schema validation |
| React Navigation | Navigation |
| React Native Maps | Map integration |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js | Web framework |
| TypeScript | Type safety |
| Supabase | PostgreSQL database & auth |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Zod | Request validation |
| Pino | Logging |
| Helmet | Security headers |

## 📊 Database Schema

The application uses Supabase (PostgreSQL) with the following main entities:

### Users
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role NOT NULL, -- 'vehicle_owner' | 'tow_operator'
  average_rating DECIMAL(2,1),
  total_trips INTEGER,
  is_online BOOLEAN,
  is_verified BOOLEAN
)
```

### Towing Requests
```sql
towing_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  operator_id UUID REFERENCES users(id),
  pickup_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  vehicle_type vehicle_type NOT NULL,
  estimated_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  distance_km DECIMAL(10, 2),
  status request_status -- 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
)
```

## 🧪 Testing

### Backend
```bash
cd backend

# Run linting
npm run lint

# Fix lint issues
npm run lint:fix
```

### Frontend
```bash
# Run linting
npm run lint
```

## 📱 App Screenshots

The application features:
1. **Onboarding**: Role selection (Vehicle Owner / Tow Operator)
2. **Authentication**: Login and Registration screens
3. **User Home**: Map with bottom sheet for requesting tows
4. **Operator Dashboard**: Online status toggle and request notifications
5. **Request Flow**: Accept → Navigate → Arrive → Tow → Complete → Rate

## 🚀 Deployment

### Backend
1. Set `NODE_ENV=production`
2. Configure production Supabase credentials
3. Set a secure `JWT_SECRET` (min 32 characters)
4. Build: `npm run build`
5. Start: `npm start`

### Frontend (Expo)
```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Or use EAS Build
npx eas build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

ISC

---

Built with ❤️ for Ghana 🇬🇭
