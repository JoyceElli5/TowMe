/**
 * Wallet Routes (Operator-facing)
 * Balance, commission info, suspension check, and withdrawal requests.
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { validateParams } from '../middleware/validate.middleware';
import { getOperatorWallet, isOperatorSuspended, getCommissionPayments } from '../services/commission.service';
import type { Request, Response } from 'express';

const router = Router();
router.use(authMiddleware);

const uuidParam = z.object({ userId: z.string().uuid() });

// GET /api/wallet/:userId/balance
router.get(
  '/:userId/balance',
  validateParams(uuidParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const wallet = await getOperatorWallet(userId);
    const suspension = await isOperatorSuspended(userId);

    res.json({
      success: true,
      data: {
        available: Math.max(0, wallet.withdrawable_balance),
        pending: 0,
        withdrawn: 0,
        currency: 'GHS',
        commissionOwed: wallet.total_commission_owed,
        commissionPaid: wallet.total_commission_paid,
        outstandingBalance: wallet.current_outstanding_balance,
        grossEarnings: wallet.total_earnings,
        netEarnings: wallet.total_earnings - wallet.total_commission_owed,
        suspended: suspension.suspended,
        suspensionThreshold: suspension.threshold,
      },
    });
  })
);

// GET /api/wallet/:userId/transactions
router.get(
  '/:userId/transactions',
  validateParams(uuidParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const payments = await getCommissionPayments(userId);

    const transactions = payments.map(p => ({
      id: p.id,
      userId,
      type: 'commission_payment',
      amount: p.amount_paid,
      currency: 'GHS',
      status: 'completed',
      description: `Commission settled - ${p.payment_method}`,
      referenceId: p.transaction_reference,
      createdAt: p.created_at,
    }));

    res.json({ success: true, data: transactions });
  })
);

// POST /api/wallet/withdraw  (stub — real payout goes through payment provider)
router.post(
  '/withdraw',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount, provider, phoneNumber } = req.body as {
      userId: string;
      amount: number;
      provider: string;
      phoneNumber: string;
    };

    res.json({
      success: true,
      data: {
        id: `wd-${Date.now()}`,
        userId,
        type: 'withdrawal',
        amount: -Math.abs(amount),
        currency: 'GHS',
        status: 'pending',
        description: `Withdrawal to ${provider} - ${phoneNumber}`,
        createdAt: new Date().toISOString(),
      },
      message: 'Withdrawal request received. Processing within 24 hours.',
    });
  })
);

// GET /api/wallet/:userId/suspension
router.get(
  '/:userId/suspension',
  validateParams(uuidParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const suspension = await isOperatorSuspended(userId);
    res.json({ success: true, data: suspension });
  })
);

export default router;
