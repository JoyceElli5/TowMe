/**
 * Authentication Routes
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { supabaseAuthMiddleware, requireSameUser } from '../middleware/supabaseAuth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody, schemas } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post(
  '/register',
  validateBody(schemas.register),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  validateBody(schemas.login),
  asyncHandler(authController.login)
);

router.post(
  '/refresh-token',
  validateBody(schemas.refreshToken),
  asyncHandler(authController.refreshToken)
);

router.post(
  '/forgot-password',
  validateBody(schemas.forgotPassword),
  asyncHandler(authController.forgotPassword)
);

router.post(
  '/reset-password',
  validateBody(schemas.resetPassword),
  asyncHandler(authController.resetPassword)
);

router.post(
  '/verify-email',
  validateBody(schemas.verifyEmail),
  asyncHandler(authController.verifyEmail)
);

router.post(
  '/resend-verification',
  validateBody(schemas.resendVerification),
  asyncHandler(authController.resendVerification)
);

// Supabase auth protected routes
// This endpoint is called after Supabase signup to create a user profile with role
router.post(
  '/create-profile',
  supabaseAuthMiddleware,
  requireSameUser,
  validateBody(schemas.createProfile),
  asyncHandler(authController.createProfile)
);

// Google OAuth sign-in / sign-up
router.post(
  '/google-login',
  supabaseAuthMiddleware,
  asyncHandler(authController.googleLogin)
);

// Get session/user data using Supabase token
// This is used after Supabase login to get the user's profile and generate backend tokens
router.get(
  '/session',
  supabaseAuthMiddleware,
  asyncHandler(authController.getSession)
);

// Protected routes (using internal JWT auth)
router.post('/logout', authMiddleware, asyncHandler(authController.logout));
router.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser));
router.patch(
  '/update-profile',
  authMiddleware,
  validateBody(schemas.updateProfile),
  asyncHandler(authController.updateProfile)
);

export default router;
