/**
 * Admin Middleware
 * Protects /api/admin routes: accept X-Admin-Key header OR Bearer token from admin login.
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

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
  if (!config.admin.secret) {
    res.status(503).json({
      success: false,
      error: 'Admin API is not configured. Set ADMIN_SECRET in environment.',
    });
    return;
  }

  const key = req.headers['x-admin-key'] as string | undefined;
  if (key && key === config.admin.secret) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, config.admin.secret) as AdminTokenPayload;
      if (decoded.purpose === 'admin') {
        next();
        return;
      }
    } catch {
      // invalid or expired token
    }
  }

  res.status(401).json({
    success: false,
    error: 'Invalid or missing admin key or login token.',
  });
}
