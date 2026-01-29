/**
 * API Module Exports
 */

// Client
export { default as api, ApiError, checkApiConnection, clearTokens, getAccessToken } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

// Auth
export {
  forgotPassword, getCurrentUser, login,
  logout, refreshAccessToken, register, resetPassword, verifyEmail
} from './auth';
export type { AuthResponse, LoginRequest, PublicUser, RegisterRequest, User } from './auth';

// Requests
export {
  acceptRequest, cancelRequest, completeRequest, createRequest, downloadReceipt, getOperatorRequests,
  getPendingRequests, getPriceEstimate, getRequestById, getRequests, getUserRequests, startRequest, trackRequest
} from './requests';
export type {
  CreateTowingRequestData, PriceEstimate, RequestFilters, RequestStatus, TowingRequest, VehicleType
} from './requests';

// Ratings
export {
  createRating, getRatingStats, getRequestRatings, getUserRatings
} from './ratings';
export type { CreateRatingData, Rating, RatingStats } from './ratings';

// Users
export {
  getUserById, getUserStats,
  toggleOperatorOnlineStatus, updateUserAvatar, updateUserProfile
} from './users';
export type { UserStats } from './users';

