/**
 * Payments Controller
 * Handles payments and pricing HTTP endpoints
 */

import { Response } from 'express';
import * as paymentsService from '../services/payments.service';
import type { AuthenticatedRequest } from '../types/api.types';

/**
 * GET /api/pricing/estimate
 */
export async function getPriceEstimate(req: AuthenticatedRequest, res: Response): Promise<void> {
  const pickupLat = parseFloat(req.query.pickupLat as string);
  const pickupLng = parseFloat(req.query.pickupLng as string);
  const destinationLat = parseFloat(req.query.destinationLat as string);
  const destinationLng = parseFloat(req.query.destinationLng as string);
  const vehicleType = req.query.vehicleType as string;

  if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(destinationLat) || isNaN(destinationLng)) {
    res.status(400).json({
      success: false,
      error: 'Invalid coordinates',
    });
    return;
  }

  if (!vehicleType) {
    res.status(400).json({
      success: false,
      error: 'Vehicle type is required',
    });
    return;
  }

  const estimate = await paymentsService.getPriceEstimate({
    pickupLat,
    pickupLng,
    destinationLat,
    destinationLng,
    vehicleType: vehicleType as any,
  });

  res.json({
    success: true,
    data: estimate,
  });
}

/**
 * POST /api/payments
 */
export async function createPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const payment = await paymentsService.processPayment(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: paymentsService.mapPaymentToResponse(payment),
    message: 'Payment processed successfully',
  });
}

/**
 * GET /api/payments/:requestId
 */
export async function getPaymentByRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { requestId } = req.params;
  const payment = await paymentsService.getPaymentByRequest(requestId);

  if (!payment) {
    res.status(404).json({
      success: false,
      error: 'Payment not found',
    });
    return;
  }

  res.json({
    success: true,
    data: paymentsService.mapPaymentToResponse(payment),
  });
}

/**
 * GET /api/payments/operator/:operatorId/earnings
 */
export async function getOperatorEarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { operatorId } = req.params;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  const earnings = await paymentsService.getOperatorEarnings(operatorId, startDate, endDate);

  res.json({
    success: true,
    data: earnings,
  });
}
