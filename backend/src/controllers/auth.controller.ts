/**
 * Authentication Controller
 * Handles authentication HTTP endpoints
 */

import { Response } from 'express';
import * as authService from '../services/auth.service';
import type { AuthenticatedRequest } from '../types/api.types';
import logger from '../utils/logger';

/**
 * POST /api/auth/register
 */
export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful',
    });
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  // In a real implementation, you would invalidate the token
  res.json({
    success: true,
    message: 'Logout successful',
  });
}

/**
 * POST /api/auth/refresh-token
 */
export async function refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link',
    });
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    throw error;
  }
}

/**
 * GET /api/auth/me
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const user = await authService.getCurrentUser(req.user.id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    throw error;
  }
}

/**
 * PATCH /api/auth/update-profile
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    // This is handled by users controller
    res.status(501).json({
      success: false,
      error: 'Use /api/users/:id endpoint to update profile',
    });
  } catch (error) {
    throw error;
  }
}
