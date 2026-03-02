/**
 * Directions Routes
 * Handles Google Directions API requests
 */

import { Router } from 'express';
import * as directionsController from '../controllers/directions.controller';
import { asyncHandler } from '../middleware/error.middleware';
import { validateQuery } from '../middleware/validate.middleware';

import { z } from 'zod';

const router = Router();

// Get route between two points
router.get(
  '/',
  validateQuery(z.object({
    origin: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, 'Invalid origin format'),
    destination: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, 'Invalid destination format'),
  })),
  asyncHandler(directionsController.getRoute)
);

export default router;

