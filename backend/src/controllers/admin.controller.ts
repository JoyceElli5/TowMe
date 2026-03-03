/**
 * Admin Controller
 * Operator verification and admin-only endpoints.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import * as adminService from '../services/admin.service';
import type { VerificationStatus } from '../services/admin.service';

/**
 * POST /api/admin/login
 * Login with email + password. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend .env.
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }

  if (!config.admin.secret || !config.admin.email || !config.admin.password) {
    res.status(503).json({
      success: false,
      error: 'Admin login not configured. Set ADMIN_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD in backend .env.',
    });
    return;
  }

  if (email !== config.admin.email || password !== config.admin.password) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' });
    return;
  }

  const token = jwt.sign(
    { purpose: 'admin', email: config.admin.email },
    config.admin.secret,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: { token, email: config.admin.email },
  });
}

/**
 * GET /api/admin/operators
 * List operators with optional filter by verification_status.
 */
export async function getOperators(req: Request, res: Response): Promise<void> {
  const status = req.query.status as VerificationStatus | undefined;
  const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

  const result = await adminService.getOperatorsForAdmin({ status, page, limit });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/admin/operators/:id
 * Get operator detail including document URLs.
 */
export async function getOperatorById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const operator = await adminService.getOperatorByIdForAdmin(id);

  res.json({
    success: true,
    data: operator,
  });
}

/**
 * PATCH /api/admin/operators/:id/verify
 * Approve or reject operator verification.
 * Body: { status: 'approved' | 'rejected', reason?: string }
 */
export async function verifyOperator(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const body = req.body as { status: 'approved' | 'rejected'; reason?: string };

  if (!body.status || !['approved', 'rejected'].includes(body.status)) {
    res.status(400).json({
      success: false,
      error: 'status must be "approved" or "rejected"',
    });
    return;
  }

  const operator = await adminService.updateOperatorVerification(id, {
    status: body.status,
    reason: body.reason,
  });

  res.json({
    success: true,
    data: operator,
    message: `Operator ${body.status}`,
  });
}
