/**
 * Authentication Routes
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
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

// Protected routes
router.post('/logout', authMiddleware, asyncHandler(authController.logout));
router.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser));
router.patch(
  '/update-profile',
  authMiddleware,
  validateBody(schemas.updateProfile),
  asyncHandler(authController.updateProfile)
);

export default router;
