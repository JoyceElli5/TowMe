/**
 * API Module Exports
 */

// Client
export { default as api, ApiError, getAccessToken, clearTokens } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

// Auth
export {
  register,
  login,
  logout,
  getCurrentUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from './auth';
export type { User, AuthResponse, RegisterRequest, LoginRequest } from './auth';

// Requests
export {
  createRequest,
  getRequests,
  getRequestById,
  getUserRequests,
  getOperatorRequests,
  getPendingRequests,
  acceptRequest,
  startRequest,
  completeRequest,
  cancelRequest,
  trackRequest,
  getPriceEstimate,
} from './requests';
export type {
  TowingRequest,
  CreateTowingRequestData,
  RequestFilters,
  PriceEstimate,
  VehicleType,
  RequestStatus,
} from './requests';

// Ratings
export {
  createRating,
  getUserRatings,
  getRequestRatings,
  getRatingStats,
} from './ratings';
export type { Rating, RatingStats, CreateRatingData } from './ratings';

// Users
export {
  getUserById,
  updateUserProfile,
  updateUserAvatar,
  getUserStats,
  toggleOperatorOnlineStatus,
} from './users';
export type { UserStats } from './users';
