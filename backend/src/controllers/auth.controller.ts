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
 * POST /api/auth/resend-verification
 */
export async function resendVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await authService.resendVerificationEmail(req.body.email);
    res.json({
      success: true,
      message: 'If your email is registered and unverified, a new code has been sent',
    });
  } catch (error) {
    throw error;
  }
}

/**
 * POST /api/auth/verify-email
 */
export async function verifyEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { token } = req.body;
    await authService.verifyEmail(token);
    res.json({
      success: true,
      message: 'Email verified successfully',
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

/**
 * POST /api/auth/create-profile
 * Creates a user profile after Supabase authentication
 * Protected by supabaseAuthMiddleware - only the authenticated user can create their profile
 */
export async function createProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await authService.createProfile(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Profile created successfully',
    });
  } catch (error) {
    throw error;
  }
}

/**
 * GET /api/auth/session
 * Gets the user's session data using Supabase token
 * Returns the user profile and generates backend tokens for subsequent API calls
 * Protected by supabaseAuthMiddleware
 */
export async function getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const result = await authService.getSessionForSupabaseUser(req.user.id);
    res.json({
      success: true,
      data: result,
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    throw error;
  }
}
