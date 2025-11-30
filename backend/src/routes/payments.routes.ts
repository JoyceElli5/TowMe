/**
 * Payments Routes
 */

import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateBody, validateParams, schemas } from '../middleware/validate.middleware';

const router = Router();

// Get price estimate (public)
router.get('/estimate', asyncHandler(paymentsController.getPriceEstimate));

// Process payment (protected)
router.post(
  '/',
  authMiddleware,
  validateBody(schemas.createPayment),
  asyncHandler(paymentsController.createPayment)
);

// Get payment for request
router.get(
  '/:requestId',
  validateParams(schemas.requestId),
  asyncHandler(paymentsController.getPaymentByRequest)
);

// Get operator earnings
router.get(
  '/operator/:operatorId/earnings',
  validateParams(schemas.operatorId),
  asyncHandler(paymentsController.getOperatorEarnings)
);

export default router;
