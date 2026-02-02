/**
 * Directions Routes
 * Handles Google Directions API requests
 */

import { Router } from 'express';
import * as directionsController from '../controllers/directions.controller';
import { asyncHandler } from '../middleware/error.middleware';
import { validateQuery } from '../middleware/validate.middleware';

const router = Router();

// Get route between two points
router.get(
  '/',
  validateQuery({
    type: 'object',
    properties: {
      origin: { type: 'string', pattern: '^-?\\d+\\.?\\d*,-?\\d+\\.?\\d*$' },
      destination: { type: 'string', pattern: '^-?\\d+\\.?\\d*,-?\\d+\\.?\\d*$' },
    },
    required: ['origin', 'destination'],
  }),
  asyncHandler(directionsController.getRoute)
);

export default router;

