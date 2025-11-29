/**
 * Operators Routes
 */

import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware, requireTowOperator } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateParams, schemas } from '../middleware/validate.middleware';

const router = Router();

// Toggle online status (protected - operators only)
router.patch(
  '/:id/online-status',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(usersController.toggleOnlineStatus)
);

export default router;
