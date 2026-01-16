/**
 * Towing Requests Routes
 */

import { Router } from 'express';
import * as requestsController from '../controllers/requests.controller';
import { authMiddleware, requireVehicleOwner, requireTowOperator } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody, validateParams, validateQuery, schemas } from '../middleware/validate.middleware';

const router = Router();

// Create new request (protected - vehicle owners)
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.createRequest),
  asyncHandler(requestsController.createRequest)
);

// Get all requests with filters
router.get(
  '/',
  validateQuery(schemas.requestFilters),
  asyncHandler(requestsController.getRequests)
);

// Get pending requests (for operators)
router.get(
  '/pending',
  authMiddleware,
  asyncHandler(requestsController.getPendingRequests)
);

// Get user's requests
router.get(
  '/user/:userId',
  validateParams(schemas.userId),
  asyncHandler(requestsController.getUserRequests)
);

// Get operator's jobs
router.get(
  '/operator/:operatorId',
  validateParams(schemas.operatorId),
  asyncHandler(requestsController.getOperatorRequests)
);

// Get single request
router.get(
  '/:id',
  validateParams(schemas.uuid),
  asyncHandler(requestsController.getRequestById)
);

// Track request (real-time location)
router.get(
  '/:id/track',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(requestsController.trackRequest)
);

// Accept request (operators)
router.patch(
  '/:id/accept',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(requestsController.acceptRequest)
);

// Start trip (operators)
router.patch(
  '/:id/start',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(requestsController.startRequest)
);

// Complete trip (operators)
router.patch(
  '/:id/complete',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(requestsController.completeRequest)
);

// Cancel request
router.patch(
  '/:id/cancel',
  authMiddleware,
  validateParams(schemas.uuid),
  validateBody(schemas.cancelRequest),
  asyncHandler(requestsController.cancelRequest)
);

// Download receipt (protected)
router.get(
  '/:id/receipt',
  authMiddleware,
  validateParams(schemas.uuid),
  asyncHandler(requestsController.downloadReceipt)
);

export default router;
