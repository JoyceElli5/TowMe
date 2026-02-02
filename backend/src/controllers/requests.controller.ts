/**
 * Towing Requests Controller
 * Handles towing request HTTP endpoints
 */

import { Response } from 'express';
import * as requestsService from '../services/requests.service';
import * as receiptService from '../services/receipt.service';
import * as usersService from '../services/users.service';
import type { AuthenticatedRequest } from '../types/api.types';
import type { RequestStatus, VehicleType } from '../types/database.types';

/**
 * POST /api/requests
 */
export async function createRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const request = await requestsService.createRequest(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: request,
    message: 'Request created successfully',
  });
}

/**
 * GET /api/requests
 */
export async function getRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  const filters = {
    status: req.query.status as RequestStatus | undefined,
    vehicleType: req.query.vehicleType as VehicleType | undefined,
    startDate: req.query.startDate as string | undefined,
    endDate: req.query.endDate as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await requestsService.getRequests(filters);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/requests/:id
 */
export async function getRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const request = await requestsService.getRequestWithDetails(id);

  res.json({
    success: true,
    data: request,
  });
}

/**
 * PATCH /api/requests/:id/accept
 */
export async function acceptRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const request = await requestsService.acceptRequest(id, req.user.id);

  res.json({
    success: true,
    data: request,
    message: 'Request accepted',
  });
}

/**
 * PATCH /api/requests/:id/start
 */
export async function startRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const request = await requestsService.startRequest(id, req.user.id);

  res.json({
    success: true,
    data: request,
    message: 'Trip started',
  });
}

/**
 * PATCH /api/requests/:id/complete
 */
export async function completeRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const request = await requestsService.completeRequest(id, req.user.id);

  res.json({
    success: true,
    data: request,
    message: 'Trip completed',
  });
}

/**
 * PATCH /api/requests/:id/cancel
 */
export async function cancelRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const { reason } = req.body;
  const request = await requestsService.cancelRequest(id, req.user.id, reason);

  res.json({
    success: true,
    data: request,
    message: 'Request cancelled',
  });
}

/**
 * GET /api/requests/user/:userId
 */
export async function getUserRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const filters = {
    status: req.query.status as RequestStatus | undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await requestsService.getUserRequests(userId, filters);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/requests/operator/:operatorId
 */
export async function getOperatorRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { operatorId } = req.params;
  const filters = {
    status: req.query.status as RequestStatus | undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await requestsService.getOperatorRequests(operatorId, filters);

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * GET /api/requests/pending
 */
export async function getPendingRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const requests = await requestsService.getPendingRequests();

  res.json({
    success: true,
    data: requests,
  });
}

/**
 * GET /api/requests/:id/track
 */
export async function trackRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const request = await requestsService.getRequestWithDetails(id);

  // Get real-time operator location if operator is assigned
  let operatorLocation = null;
  if (request.operator?.id) {
    const location = await usersService.getOperatorLocation(request.operator.id);
    operatorLocation = location;
  }

  res.json({
    success: true,
    data: {
      request,
      operatorLocation,
    },
  });
}

/**
 * GET /api/requests/:id/receipt
 */
export async function downloadReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const receiptData = await receiptService.generateReceiptData(id, req.user.id);
  const receiptText = receiptService.formatReceiptAsText(receiptData);

  // Set headers for text/plain response
  // In production, you might want to generate a PDF using a library like pdfkit
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="towme-receipt-${id}.txt"`);
  res.send(receiptText);
}
