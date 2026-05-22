/**
 * Admin Routes
 * Login is public; other routes require X-Admin-Key or Bearer token from login.
 */

import { Router } from 'express';
import { z } from 'zod';
import * as adminController from '../controllers/admin.controller';
import { adminMiddleware } from '../middleware/admin.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { strictLimiter } from '../middleware/rateLimiter';
import { validateBody, validateParams } from '../middleware/validate.middleware';

const router = Router();

// Public: login with email + password (credentials set in backend .env)
// strictLimiter: 10 requests per 15 minutes per IP to prevent brute-force
router.post(
  '/login',
  strictLimiter,
  validateBody(z.object({ email: z.string().email(), password: z.string().min(1) })),
  asyncHandler(adminController.adminLogin)
);

router.use(adminMiddleware);

const verifyBody = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().max(500).optional(),
});

// List operators (optional ?status=pending|approved|rejected)
router.get(
  '/operators',
  asyncHandler(adminController.getOperators)
);

// Get operator detail
router.get(
  '/operators/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(adminController.getOperatorById)
);

// Approve or reject operator
router.patch(
  '/operators/:id/verify',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(verifyBody),
  asyncHandler(adminController.verifyOperator)
);

// Commission summary (platform-wide)
router.get(
  '/commission/summary',
  asyncHandler(adminController.getCommissionSummaryHandler)
);

// Operator wallet / balance
router.get(
  '/operators/:id/wallet',
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(adminController.getOperatorWalletHandler)
);

// Operator commission payment history
router.get(
  '/operators/:id/commission-payments',
  validateParams(z.object({ id: z.string().uuid() })),
  asyncHandler(adminController.getOperatorCommissionPaymentsHandler)
);

// Settle operator commission debt
const settleBody = z.object({
  amountPaid: z.number().positive(),
  paymentMethod: z.string().min(1),
  transactionReference: z.string().optional(),
  adminNotes: z.string().max(500).optional(),
});

router.post(
  '/operators/:id/settle-commission',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(settleBody),
  asyncHandler(adminController.settleCommissionHandler)
);

export default router;
