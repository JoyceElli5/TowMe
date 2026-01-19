/**
 * Error Handling Middleware
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create common HTTP errors
 */
export const createError = {
  badRequest: (message: string = 'Bad request') => new ApiError(message, 400),
  unauthorized: (message: string = 'Unauthorized') => new ApiError(message, 401),
  forbidden: (message: string = 'Forbidden') => new ApiError(message, 403),
  notFound: (message: string = 'Not found') => new ApiError(message, 404),
  conflict: (message: string = 'Conflict') => new ApiError(message, 409),
  unprocessable: (message: string = 'Unprocessable entity') => new ApiError(message, 422),
  tooManyRequests: (message: string = 'Too many requests') => new ApiError(message, 429),
  internal: (message: string = 'Internal server error') => new ApiError(message, 500),
};

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error({
    err,
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
    return;
  }

  // Handle Supabase errors
  if (err.message?.includes('duplicate key')) {
    res.status(409).json({
      success: false,
      error: 'Resource already exists',
    });
    return;
  }

  if (err.message?.includes('violates foreign key')) {
    res.status(400).json({
      success: false,
      error: 'Referenced resource not found',
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Async handler wrapper to catch errors in async routes
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
