/**
 * Supabase Authentication Middleware
 * Verifies Supabase JWTs for protected routes
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import type { AuthenticatedRequest } from '../types/api.types';
import type { UserRole } from '../types/database.types';
import logger from '../utils/logger';

// Supabase JWT payload structure
interface SupabaseJWTPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  email: string;
  phone?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  user_metadata?: Record<string, unknown>;
  role?: string;
  aal?: string;
  amr?: { method: string; timestamp: number }[];
  session_id?: string;
}

/**
 * Get the JWT secret for Supabase token verification
 * Supabase uses the JWT secret from the project settings
 * This should be set as SUPABASE_JWT_SECRET in environment variables
 */
function getSupabaseJWTSecret(): string {
  // The Supabase JWT secret is typically the same as the project's JWT secret
  // It can be found in Supabase Dashboard > Settings > API > JWT Settings
  const jwtSecret = config.supabase.jwtSecret || config.jwt.secret;
  
  if (!jwtSecret) {
    throw new Error('SUPABASE_JWT_SECRET environment variable is not set');
  }
  
  return jwtSecret;
}

/**
 * Middleware to verify Supabase JWT tokens
 * This verifies that the request is authenticated via Supabase Auth
 */
export async function supabaseAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify the Supabase JWT token
    const decoded = jwt.verify(token, getSupabaseJWTSecret()) as SupabaseJWTPayload;

    // Validate that it's a Supabase token by checking the issuer format
    // Supabase issuer format: https://<project-ref>.supabase.co/auth/v1
    const expectedIssuerPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co\/auth\/v1$/;
    if (decoded.iss && !expectedIssuerPattern.test(decoded.iss)) {
      res.status(401).json({
        success: false,
        error: 'Invalid token issuer',
      });
      return;
    }

    // Attach user info to request from Supabase JWT
    // Note: Role is not set here as it should be retrieved from the database
    // The role will be determined during profile creation or session retrieval
    req.user = {
      id: decoded.sub, // Supabase uses 'sub' for user ID
      email: decoded.email,
      role: 'vehicle_owner' as UserRole, // Placeholder - actual role from DB in service layer
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    logger.error('Supabase auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Middleware to ensure the authenticated user can only access/modify their own resources
 * Compares the user ID from the token with the userId in the request body or params
 */
export function requireSameUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Check userId in body or params
  const requestedUserId = req.body.userId || req.params.userId || req.params.id;

  if (requestedUserId && requestedUserId !== req.user.id) {
    res.status(403).json({
      success: false,
      error: 'You can only access your own resources',
    });
    return;
  }

  next();
}
