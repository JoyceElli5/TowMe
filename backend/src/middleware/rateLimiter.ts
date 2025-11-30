/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request frequency
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

/**
 * General rate limiter for API endpoints
 * 1000 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 * 100 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Very strict rate limiter for sensitive operations
 * 10 requests per 15 minutes per IP
 */
export const strictLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 10,
  message: {
    success: false,
    error: 'Rate limit exceeded for this operation',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
