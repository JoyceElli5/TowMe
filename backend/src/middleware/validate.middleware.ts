/**
 * Validation Middleware
 * Request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import type { UserRole, VehicleType, VehicleCondition, RequestStatus } from '../types/database.types';

/**
 * Middleware factory to validate request body against a Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware factory to validate request query against a Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Middleware factory to validate request params against a Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    role: z.enum(['vehicle_owner', 'tow_operator'] as const) as z.ZodType<UserRole>,
  }),

  login: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),

  forgotPassword: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),

  verifyEmail: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),

  resendVerification: z.object({
    email: z.string().email('Please enter a valid email address'),
  }),

  // Create profile schema (for Supabase auth flow)
  createProfile: z.object({
    userId: z.string().uuid('Invalid user ID'),
    email: z.string().email('Please enter a valid email address'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    role: z.enum(['vehicle_owner', 'tow_operator'] as const) as z.ZodType<UserRole>,
  }),

  // User schemas
  updateProfile: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    avatarUrl: z.string().url().optional(),
  }),

  // Towing request schemas
  createRequest: z.object({
    pickupAddress: z.string().min(1, 'Pickup address is required'),
    destinationAddress: z.string().min(1, 'Destination address is required'),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    destinationLat: z.number().min(-90).max(90),
    destinationLng: z.number().min(-180).max(180),
    vehicleType: z.enum(['car', 'suv', 'saloon', 'van', 'truck', 'motorcycle', 'others'] as const) as z.ZodType<VehicleType>,
  }),

  requestFilters: z.object({
    status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled'] as const).optional() as z.ZodType<RequestStatus | undefined>,
    vehicleType: z.enum(['car', 'suv', 'saloon', 'van', 'truck', 'motorcycle', 'others'] as const).optional() as z.ZodType<VehicleType | undefined>,
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),

  cancelRequest: z.object({
    reason: z.string().optional(),
  }),

  // Rating schemas
  createRating: z.object({
    requestId: z.string().uuid('Invalid request ID'),
    toUserId: z.string().uuid('Invalid user ID'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional(),
  }),

  // Inspection schemas
  createInspection: z.object({
    requestId: z.string().uuid('Invalid request ID'),
    vehicleCondition: z.enum(['good', 'damaged', 'needs_attention'] as const) as z.ZodType<VehicleCondition>,
    notes: z.string().max(1000).optional(),
    photos: z.array(z.string().url()).min(3, 'At least 3 photos required').max(10, 'Maximum 10 photos allowed'),
  }),

  // Payment schemas
  priceEstimate: z.object({
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    destinationLat: z.number().min(-90).max(90),
    destinationLng: z.number().min(-180).max(180),
    vehicleType: z.enum(['car', 'suv', 'saloon', 'van', 'truck', 'motorcycle', 'others'] as const) as z.ZodType<VehicleType>,
  }),

  createPayment: z.object({
    requestId: z.string().uuid('Invalid request ID'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
  }),

  // Location schemas
  updateLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    heading: z.number().min(0).max(360).optional(),
    speed: z.number().min(0).optional(),
    requestId: z.string().uuid().optional(),
  }),

  // Common schemas
  uuid: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  userId: z.object({
    userId: z.string().uuid('Invalid user ID format'),
  }),

  requestId: z.object({
    requestId: z.string().uuid('Invalid request ID format'),
  }),

  requestIdParam: z.object({
    requestId: z.string().uuid('Invalid request ID format'),
  }),

  operatorId: z.object({
    operatorId: z.string().uuid('Invalid operator ID format'),
  }),

  // Message schemas
  sendMessage: z.object({
    requestId: z.string().uuid('Invalid request ID'),
    receiverId: z.string().uuid('Invalid receiver ID'),
    content: z.string().min(1, 'Message content is required').max(5000, 'Message is too long'),
  }),
};
