/**
 * Ratings Routes
 */

import { Router } from 'express';
import * as ratingsController from '../controllers/ratings.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody, validateParams, schemas } from '../middleware/validate.middleware';

const router = Router();

// Submit rating (protected)
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.createRating),
  asyncHandler(ratingsController.createRating)
);

// Get ratings for user
router.get(
  '/user/:userId',
  validateParams(schemas.userId),
  asyncHandler(ratingsController.getUserRatings)
);

// Get ratings for request
router.get(
  '/request/:requestId',
  validateParams(schemas.requestId),
  asyncHandler(ratingsController.getRequestRatings)
);

// Get rating stats for user
router.get(
  '/stats/:userId',
  validateParams(schemas.userId),
  asyncHandler(ratingsController.getRatingStats)
);

export default router;
