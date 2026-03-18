/**
 * Users Controller
 * Handles user management HTTP endpoints
 */

import { Response } from 'express';
import * as usersService from '../services/users.service';
import * as ratingsService from '../services/ratings.service';
import type { AuthenticatedRequest } from '../types/api.types';

/**
 * GET /api/users/:id
 */
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await usersService.getUserById(id);

  // Map to response format (hide sensitive fields)
  res.json({
    success: true,
    data: {
      id: user.id,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      averageRating: user.average_rating,
      totalTrips: user.total_trips,
      isOnline: user.is_online,
      isVerified: user.is_verified,
      createdAt: user.created_at,
    },
  });
}

/**
 * PATCH /api/users/:id
 */
export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;

  // Only allow users to update their own profile
  if (req.user.id !== id) {
    res.status(403).json({ success: false, error: 'Cannot update other users' });
    return;
  }

  const user = await usersService.updateUserProfile(id, req.body);

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatar_url,
      averageRating: user.average_rating,
      totalTrips: user.total_trips,
      isOnline: user.is_online,
      isVerified: user.is_verified,
    },
    message: 'Profile updated successfully',
  });
}

/**
 * GET /api/users/:id/ratings
 */
export async function getUserRatings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await ratingsService.getUserRatings(id, page, limit);

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
 * GET /api/users/:id/stats
 */
export async function getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const stats = await usersService.getUserStats(id);

  res.json({
    success: true,
    data: stats,
  });
}

/**
 * PATCH /api/users/:id/avatar
 */
export async function updateAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;

  if (req.user.id !== id) {
    res.status(403).json({ success: false, error: 'Cannot update other users' });
    return;
  }

  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    res.status(400).json({ success: false, error: 'Avatar URL is required' });
    return;
  }

  const user = await usersService.updateUserAvatar(id, avatarUrl);

  res.json({
    success: true,
    data: { avatarUrl: user.avatar_url },
    message: 'Avatar updated successfully',
  });
}

/**
 * PATCH /api/users/push-token
 */
export async function updatePushToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { pushToken } = req.body;

  if (!pushToken || typeof pushToken !== 'string') {
    res.status(400).json({ success: false, error: 'pushToken is required' });
    return;
  }

  await usersService.savePushToken(req.user.id, pushToken);

  res.json({ success: true, message: 'Push token saved' });
}

/**
 * PATCH /api/operators/:id/online-status
 */
export async function toggleOnlineStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;

  if (req.user.id !== id) {
    res.status(403).json({ success: false, error: 'Cannot update other operators' });
    return;
  }

  const { isOnline } = req.body;

  if (typeof isOnline !== 'boolean') {
    res.status(400).json({ success: false, error: 'isOnline must be a boolean' });
    return;
  }

  const user = await usersService.toggleOperatorOnlineStatus(id, isOnline);

  res.json({
    success: true,
    data: { isOnline: user.is_online },
    message: `You are now ${user.is_online ? 'online' : 'offline'}`,
  });
}

/**
 * PATCH /api/operators/:id/location
 */
export async function updateOperatorLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const { id } = req.params;

  if (req.user.id !== id) {
    res.status(403).json({ success: false, error: 'Cannot update other operators' });
    return;
  }

  const { latitude, longitude, heading } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    res.status(400).json({ success: false, error: 'latitude and longitude are required numbers' });
    return;
  }

  await usersService.updateOperatorLocation(id, { latitude, longitude, heading: heading || null });

  res.json({
    success: true,
    message: 'Location updated successfully',
  });
}