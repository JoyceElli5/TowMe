/**
 * Ratings Controller
 * Handles ratings HTTP endpoints
 */

import { Response } from 'express';
import * as ratingsService from '../services/ratings.service';
import type { AuthenticatedRequest } from '../types/api.types';

/**
 * POST /api/ratings
 */
export async function createRating(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const rating = await ratingsService.createRating(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: rating,
    message: 'Rating submitted successfully',
  });
}

/**
 * GET /api/ratings/user/:userId
 */
export async function getUserRatings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await ratingsService.getUserRatings(userId, page, limit);

  res.json({
    success: true,
    data: result.ratings,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      hasMore: page * limit < result.total,
    },
  });
}

/**
 * GET /api/ratings/request/:requestId
 */
export async function getRequestRatings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { requestId } = req.params;
  const ratings = await ratingsService.getRequestRatings(requestId);

  res.json({
    success: true,
    data: ratings,
  });
}

/**
 * GET /api/ratings/stats/:userId
 */
export async function getRatingStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const stats = await ratingsService.getRatingStats(userId);

  res.json({
    success: true,
    data: stats,
  });
}
