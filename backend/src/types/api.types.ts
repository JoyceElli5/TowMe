/**
 * API request and response types
 */

import { Request } from 'express';
import { RequestStatus, UserRole, VehicleCondition, VehicleType } from './database.types';

// Extend Express Request to include user info
export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Auth types
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Create profile request (for Supabase auth flow)
export interface CreateProfileRequest {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: UserRole;
    avatarUrl: string | null;
    averageRating: number;
    totalTrips: number;
    isOnline: boolean;
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// User types
export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

// Towing request types
export interface CreateTowingRequest {
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  vehicleType: VehicleType;
}

export interface TowingRequestFilters {
  status?: RequestStatus;
  vehicleType?: VehicleType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TowingRequestResponse {
  id: string;
  userId: string;
  operatorId: string | null;
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  vehicleType: VehicleType;
  estimatedPrice: number;
  finalPrice: number | null;
  distanceKm: number;
  status: RequestStatus;
  cancellationReason: string | null;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  user?: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl: string | null;
    averageRating: number;
  };
  operator?: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl: string | null;
    averageRating: number;
  } | null;
}

// Rating types
export interface CreateRatingRequest {
  requestId: string;
  toUserId: string;
  rating: number;
  comment?: string;
}

export interface RatingResponse {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  fromUser?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface RatingStats {
  userId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Inspection types
export interface CreateInspectionRequest {
  requestId: string;
  vehicleCondition: VehicleCondition;
  notes?: string;
  photos: string[];
}

export interface InspectionResponse {
  id: string;
  requestId: string;
  operatorId: string;
  photos: string[];
  vehicleCondition: VehicleCondition;
  notes: string | null;
  createdAt: string;
}

// Payment types
export interface PriceEstimateRequest {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  vehicleType: VehicleType;
}

export interface PriceEstimateResponse {
  distanceKm: number;
  basePrice: number;
  vehicleMultiplier: number;
  estimatedPrice: number;
  currency: string;
}

export interface CreatePaymentRequest {
  requestId: string;
  paymentMethod: string;
}

export interface PaymentResponse {
  id: string;
  requestId: string;
  userId: string;
  operatorId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  transactionReference: string;
  createdAt: string;
  completedAt: string | null;
}

// Operator location types
export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  requestId?: string;
}

export interface LocationResponse {
  operatorId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  timestamp: string;
}

// Messaging types
export interface SendMessageRequest {
  requestId: string;
  receiverId: string;
  content: string;
}

export interface MessageResponse {
  id: string;
  requestId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// Analytics types
export interface UserAnalytics {
  userId: string;
  totalTrips: number;
  totalSpent: number;
  averageRating: number;
  tripsThisMonth: number;
  favoriteVehicleType: VehicleType | null;
}

export interface OperatorAnalytics {
  operatorId: string;
  totalTrips: number;
  totalEarnings: number;
  averageRating: number;
  tripsThisMonth: number;
  tripsToday: number;
  acceptanceRate: number;
  averageResponseTime: number;
}

export interface SystemAnalytics {
  totalUsers: number;
  totalOperators: number;
  totalRequests: number;
  completedRequests: number;
  activeRequests: number;
  totalRevenue: number;
  averageRating: number;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
