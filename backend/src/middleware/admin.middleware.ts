/**
 * Admin Middleware
 * Protects /api/admin routes: accept X-Admin-Key header OR Bearer token from admin login.
 */

import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import logger from '../utils/logger';

interface AdminTokenPayload {
  purpose: 'admin';
  email: string;
  iat?: number;
  exp?: number;
}

export function adminMiddleware(
  req: any,
  res: Response,
  next: NextFunction
): void {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  if (!config.admin.secret) {
    logger.warn({ ip }, 'Admin API access attempted but ADMIN_SECRET is not configured');
    res.status(503).json({
      success: false,
      error: 'Admin API is not configured. Set ADMIN_SECRET in environment.',
    });
    return;
  }

  // X-Admin-Key: allowed in development only
  const key = req.headers['x-admin-key'] as string | undefined;
  if (key) {
    if (config.nodeEnv === 'production') {
      logger.warn({ ip }, 'X-Admin-Key rejected in production environment');
    } else if (key === config.admin.secret) {
      logger.info({ ip }, 'Admin authenticated via X-Admin-Key (dev only)');
      next();
      return;
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, config.admin.secret) as AdminTokenPayload;
      if (decoded.purpose === 'admin') {
        logger.info({ ip, email: decoded.email }, 'Admin authenticated via Bearer token');
        next();
        return;
      }
    } catch {
      // invalid or expired token
    }
  }

  logger.warn({ ip }, 'Failed admin authentication attempt');
  res.status(401).json({
    success: false,
    error: 'Invalid or missing admin key or login token.',
  });
}
