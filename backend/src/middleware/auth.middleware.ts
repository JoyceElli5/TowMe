/**
 * Authentication Middleware
 * Verifies JWT tokens and adds user info to the request
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { getSupabaseAdmin } from '../config/database';
import type { AuthenticatedRequest } from '../types/api.types';
import type { UserRole } from '../types/database.types';
import logger from '../utils/logger';

interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate requests using JWT
 */
export async function authMiddleware(
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

    // Verify the token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
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

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user is a vehicle owner
 */
export function requireVehicleOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRole('vehicle_owner')(req, res, next);
}

/**
 * Middleware to check if user is a tow operator
 */
export function requireTowOperator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRole('tow_operator')(req, res, next);
}

/**
 * Generate JWT token for a user
 */
export function generateToken(userId: string, email: string, role: UserRole): string {
  return jwt.sign(
    {
      sub: userId,
      email,
      role,
    },
    config.jwt.secret,
    { expiresIn: '24h' }
  );
}

/**
 * Generate refresh token for a user
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    config.jwt.secret,
    { expiresIn: '7d' }
  );
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
    return { userId: decoded.sub };
  } catch {
    return null;
  }
}
