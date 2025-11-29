/**
 * Users Routes
 */

import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware, requireTowOperator } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody, validateParams, schemas } from '../middleware/validate.middleware';

const router = Router();

// Get user by ID
router.get(
  '/:id',
  validateParams(schemas.uuid),
  asyncHandler(usersController.getUserById)
);

// Update user profile (protected)
router.patch(
  '/:id',
  authMiddleware,
  validateParams(schemas.uuid),
  validateBody(schemas.updateProfile),
  asyncHandler(usersController.updateUser)
);

// Get user ratings
router.get(
  '/:id/ratings',
  validateParams(schemas.uuid),
  asyncHandler(usersController.getUserRatings)
);

// Get user stats
router.get(
  '/:id/stats',
  validateParams(schemas.uuid),
  asyncHandler(usersController.getUserStats)
);

// Update avatar (protected)
router.patch(
  '/:id/avatar',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(usersController.updateAvatar)
);

export default router;
