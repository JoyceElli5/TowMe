/**
 * API Module Exports
 */

// Client
export { API_BASE_URL, default as api, ApiError, checkApiConnection, clearTokens, getAccessToken } from './client';
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

// Operators
export {
  createOperatorProfile,
  getOperatorProfile,
  updateOperatorProfile,
  submitForVerification,
  registerVehicle,
  getOperatorVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  uploadDocument,
  getOperatorDocuments,
  deleteDocument,
  goOnline,
  goOffline,
  updateOperatorLocation,
  getOperatorAvailability,
  findNearbyOperators,
  checkOnboardingStatus
} from './operators';
export type {
  TowTruckType,
  DocumentType,
  DocumentStatus,
  OperatorStatus,
  OperatorProfile,
  OperatorVehicle,
  OperatorDocument,
  OperatorAvailability
} from './operators';

// Notifications
export {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from './notifications';
export type { AppNotification, NotificationsResponse } from './notifications';

