# TowMe Backend API

A production-ready, scalable backend API for TowMe - a roadside assistance and towing request mobile application.

## 🚀 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account ([Create one here](https://supabase.com))

## 🛠️ Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `JWT_SECRET` | Secret key for JWT signing (min 32 characters) |
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | Environment: development/production |

### 3. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and run the contents of `database/schema.sql`

### 4. Seed Demo Data (Optional)

```bash
npm run seed
```

This creates:
- 20 users (15 vehicle owners, 5 operators)
- 50 towing requests
- 40 ratings
- 20 inspections

### 5. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

All protected endpoints require a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get tokens |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/refresh-token` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/me` | Get current user |

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:id` | Get user by ID |
| PATCH | `/users/:id` | Update user profile |
| GET | `/users/:id/ratings` | Get user ratings |
| GET | `/users/:id/stats` | Get user statistics |
| PATCH | `/users/:id/avatar` | Update user avatar |

#### Operators
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/operators/:id/online-status` | Toggle online/offline |

#### Towing Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/requests` | Create new request |
| GET | `/requests` | Get all requests (with filters) |
| GET | `/requests/:id` | Get request by ID |
| GET | `/requests/pending` | Get pending requests |
| GET | `/requests/user/:userId` | Get user's requests |
| GET | `/requests/operator/:operatorId` | Get operator's jobs |
| GET | `/requests/:id/track` | Track request (with location) |
| PATCH | `/requests/:id/accept` | Accept request (operator) |
| PATCH | `/requests/:id/start` | Start towing |
| PATCH | `/requests/:id/complete` | Complete trip |
| PATCH | `/requests/:id/cancel` | Cancel request |

#### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ratings` | Submit rating |
| GET | `/ratings/user/:userId` | Get user ratings |
| GET | `/ratings/request/:requestId` | Get request ratings |
| GET | `/ratings/stats/:userId` | Get rating statistics |

#### Inspections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/inspections` | Create inspection |
| GET | `/inspections/:requestId` | Get inspection |
| POST | `/inspections/:id/photos` | Add photos |
| GET | `/inspections/operator/:operatorId` | Get operator inspections |

#### Pricing & Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pricing/estimate` | Get price estimate |
| POST | `/payments` | Process payment |
| GET | `/payments/:requestId` | Get payment details |
| GET | `/payments/operator/:operatorId/earnings` | Get earnings |

### Request/Response Examples

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "fullName": "Kwame Asante",
  "phone": "0241234567",
  "role": "vehicle_owner"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Kwame Asante",
      "phone": "0241234567",
      "role": "vehicle_owner",
      "averageRating": 0,
      "totalTrips": 0,
      "isOnline": false,
      "isVerified": false
    },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

#### Create Towing Request
```bash
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickupAddress": "Ring Road Central, Accra",
  "destinationAddress": "Accra Mall",
  "pickupLat": 5.5500,
  "pickupLng": -0.2050,
  "destinationLat": 5.6350,
  "destinationLng": -0.1650,
  "vehicleType": "suv"
}
```

#### Get Price Estimate
```bash
GET /api/pricing/estimate?pickupLat=5.55&pickupLng=-0.205&destinationLat=5.635&destinationLng=-0.165&vehicleType=suv
```

Response:
```json
{
  "success": true,
  "data": {
    "distanceKm": 10.5,
    "basePrice": 15,
    "vehicleMultiplier": 1.3,
    "estimatedPrice": 204.75,
    "currency": "GH₵"
  }
}
```

## 💰 Pricing Logic

| Vehicle Type | Multiplier |
|--------------|------------|
| Motorcycle | 0.7x |
| Car | 1.0x |
| Saloon | 1.1x |
| SUV | 1.3x |
| Van | 1.5x |
| Others | 1.8x |
| Truck | 2.0x |

- **Base Rate**: GH₵15/km
- **Minimum Fare**: GH₵50
- **Formula**: `max(distance × 15 × multiplier, 50)`

## 🔒 Security Features

- **JWT Authentication** with 24h expiry
- **Password Hashing** with bcrypt
- **Rate Limiting**: 
  - Auth endpoints: 100 requests/15 min
  - General endpoints: 1000 requests/15 min
- **Helmet.js** for HTTP security headers
- **CORS** configured for mobile app origins
- **Input Validation** with Zod schemas
- **Row Level Security (RLS)** in Supabase

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # Supabase client
│   │   ├── env.ts        # Environment variables
│   │   └── constants.ts  # App constants
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rateLimiter.ts
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── scripts/          # Scripts (seed, etc.)
│   └── server.ts         # Entry point
├── database/
│   └── schema.sql        # Database schema
├── .env.example
├── package.json
└── tsconfig.json
```

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","phone":"0241234567","role":"vehicle_owner"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman/Thunder Client

Import the API collection from the endpoints above.

## 🔄 Request Lifecycle

```
pending → accepted → in_progress → completed
     ↘           ↗        ↘      ↗
        cancelled         cancelled
```

## 📊 Database Schema

See `database/schema.sql` for the complete schema including:
- Users (vehicle owners & operators)
- Towing Requests
- Ratings
- Inspections
- Operator Locations
- Notifications
- Payments

## 🚀 Deployment

### Environment Setup

Set `NODE_ENV=production` and configure:
- Secure `JWT_SECRET` (32+ characters)
- Production Supabase credentials
- CORS origins for your app

### Build for Production

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if Supabase URL is correct
   - Verify API keys are valid

2. **Invalid token**
   - Token may be expired (24h validity)
   - Ensure correct Bearer format

3. **Rate limit exceeded**
   - Wait 15 minutes or use different IP
   - Check if making too many requests

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

Built with ❤️ for Ghana 🇬🇭
