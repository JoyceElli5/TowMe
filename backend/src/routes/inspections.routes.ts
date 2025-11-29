/**
 * Inspections Routes
 */

import { Router } from 'express';
import * as inspectionsController from '../controllers/inspections.controller';
import { authMiddleware, requireTowOperator } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody, validateParams, schemas } from '../middleware/validate.middleware';

const router = Router();

// Create inspection (protected - operators)
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.createInspection),
  asyncHandler(inspectionsController.createInspection)
);

// Get inspection for request
router.get(
  '/:requestId',
  validateParams(schemas.requestId),
  asyncHandler(inspectionsController.getInspectionByRequest)
);

// Add photos to inspection (protected)
router.post(
  '/:id/photos',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(inspectionsController.addPhotos)
);

// Get operator's inspections
router.get(
  '/operator/:operatorId',
  validateParams(schemas.operatorId),
  asyncHandler(inspectionsController.getOperatorInspections)
);

export default router;
