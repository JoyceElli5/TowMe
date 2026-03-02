# Booking (Towing Requests) & Messages

## Messages: stored in DB

- **All messages are stored in the database.** When a user or operator sends a message:
  1. The client calls `POST /api/messages` with `{ requestId, receiverId, content }`.
  2. The backend validates the sender/receiver are the request’s user and operator, then **inserts a row into the `messages` table** in Supabase.
  3. The client can also subscribe to Supabase Realtime on `messages` for live updates.

So every message sent through the app is persisted in the `messages` table.

---

## Booking logic: which HTTP method to use

Use this as the single source of truth for the **towing request (booking)** API.

| Action | Method | Endpoint | Who | Body / Notes |
|--------|--------|----------|-----|--------------|
| **Create booking** | `POST` | `/api/requests` | User (vehicle owner) | `pickupAddress`, `destinationAddress`, `pickupLat`, `pickupLng`, `destinationLat`, `destinationLng`, `vehicleType` |
| List my requests/jobs | `GET` | `/api/requests` | User or operator | Query: `status`, `vehicleType`, `startDate`, `endDate`, `page`, `limit` |
| Get one request | `GET` | `/api/requests/:id` | Participant only | — |
| User’s request history | `GET` | `/api/requests/user/:userId` | User (must be same as `userId`) | Query: `status`, `page`, `limit` |
| Operator’s jobs | `GET` | `/api/requests/operator/:operatorId` | Operator (must be same as `operatorId`) | Query: `status`, `page`, `limit` |
| Pending requests (for operators) | `GET` | `/api/requests/pending` | Operator | — |
| Track request (live) | `GET` | `/api/requests/:id/track` | Participant only | Returns request + operator location |
| **Accept request** | `PATCH` | `/api/requests/:id/accept` | Operator | No body. Atomic (only if status is still `pending`). |
| Decline request | `PATCH` | `/api/requests/:id/decline` | Operator | No body |
| Start trip | `PATCH` | `/api/requests/:id/start` | Operator | No body |
| Complete trip | `PATCH` | `/api/requests/:id/complete` | Operator | No body |
| Cancel request | `PATCH` | `/api/requests/:id/cancel` | User or operator (participant) | Body: `{ reason?: string }` |
| Download receipt | `GET` | `/api/requests/:id/receipt` | Participant only | Returns text receipt |

### Summary

- **POST** = create a new booking (one endpoint: `POST /api/requests`).
- **GET** = read (list, get one, track, receipt, pending). All require auth; list/get/track/receipt are restricted to participants.
- **PATCH** = change state (accept, decline, start, complete, cancel). No GET/POST for these actions.

The client in `client/lib/api/requests.ts` already uses these methods and endpoints.

### Booking lifecycle

1. **User**: `POST /api/requests` → request created with status `pending`.
2. **Operator**: `GET /api/requests/pending` → sees job; `PATCH /api/requests/:id/accept` → accepts (atomic).
3. **Operator**: `PATCH /api/requests/:id/start` → status `in_progress`.
4. **Operator**: `PATCH /api/requests/:id/complete` → status `completed`.
5. **User or operator** can `PATCH /api/requests/:id/cancel` (with optional `reason`) when allowed by business rules.
