/**
 * Inspections Controller
 * Handles inspections HTTP endpoints
 */

import { Response } from 'express';
import * as inspectionsService from '../services/inspections.service';
import type { AuthenticatedRequest } from '../types/api.types';

/**
 * POST /api/inspections
 */
export async function createInspection(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const inspection = await inspectionsService.createInspection(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: inspection,
    message: 'Inspection created successfully',
  });
}

/**
 * GET /api/inspections/:requestId
 */
export async function getInspectionByRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { requestId } = req.params;
  const inspection = await inspectionsService.getInspectionByRequest(requestId);

  if (!inspection) {
    res.status(404).json({
      success: false,
      error: 'Inspection not found',
    });
    return;
  }

  res.json({
    success: true,
    data: inspection,
  });
}

/**
 * POST /api/inspections/:id/photos
 */
export async function addPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  const { photos } = req.body;

  if (!Array.isArray(photos) || photos.length === 0) {
    res.status(400).json({
      success: false,
      error: 'Photos array is required',
    });
    return;
  }

  const inspection = await inspectionsService.addInspectionPhotos(id, req.user.id, photos);

  res.json({
    success: true,
    data: inspection,
    message: 'Photos added successfully',
  });
}

/**
 * GET /api/inspections/operator/:operatorId
 */
export async function getOperatorInspections(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { operatorId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await inspectionsService.getOperatorInspections(operatorId, page, limit);

  res.json({
    success: true,
    data: result.inspections,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      hasMore: page * limit < result.total,
    },
  });
}
