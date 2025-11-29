/**
 * Ratings Service
 * Handles trip ratings and user rating statistics
 */

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { REQUEST_STATUS, RATING } from '../config/constants';
import { createError } from '../middleware/error.middleware';
import { updateUserRating } from './users.service';
import type { CreateRatingRequest, RatingResponse, RatingStats } from '../types/api.types';
import type { Rating } from '../types/database.types';
import logger from '../utils/logger';

/**
 * Submit a rating for a trip
 */
export async function createRating(
  fromUserId: string,
  data: CreateRatingRequest
): Promise<Rating> {
  const supabase = getSupabaseAdmin();

  // Verify request exists and is completed
  const { data: request } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', data.requestId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  if (request.status !== REQUEST_STATUS.COMPLETED) {
    throw createError.conflict('Can only rate completed trips');
  }

  // Verify user was part of this trip
  if (request.user_id !== fromUserId && request.operator_id !== fromUserId) {
    throw createError.forbidden('You were not part of this trip');
  }

  // Verify target user was part of this trip
  if (request.user_id !== data.toUserId && request.operator_id !== data.toUserId) {
    throw createError.badRequest('Invalid target user');
  }

  // Cannot rate yourself
  if (fromUserId === data.toUserId) {
    throw createError.badRequest('Cannot rate yourself');
  }

  // Check for duplicate rating
  const { data: existingRating } = await supabase
    .from('ratings')
    .select('id')
    .eq('request_id', data.requestId)
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', data.toUserId)
    .single();

  if (existingRating) {
    throw createError.conflict('You have already rated this user for this trip');
  }

  // Validate rating value
  if (data.rating < RATING.MIN || data.rating > RATING.MAX) {
    throw createError.badRequest(`Rating must be between ${RATING.MIN} and ${RATING.MAX}`);
  }

  // Create rating
  const { data: rating, error } = await supabase
    .from('ratings')
    .insert({
      id: uuidv4(),
      request_id: data.requestId,
      from_user_id: fromUserId,
      to_user_id: data.toUserId,
      rating: data.rating,
      comment: data.comment || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating rating:', error);
    throw createError.internal('Failed to submit rating');
  }

  // Update user's average rating
  await updateUserRating(data.toUserId);

  return rating;
}

/**
 * Get ratings received by a user
 */
export async function getUserRatings(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ ratings: RatingResponse[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const offset = (page - 1) * limit;

  const { data: ratings, error, count } = await supabase
    .from('ratings')
    .select('*', { count: 'exact' })
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Error fetching user ratings:', error);
    throw createError.internal('Failed to fetch ratings');
  }

  // Get from_user details
  const ratingsWithUsers = await Promise.all(
    (ratings || []).map(async (rating) => {
      const { data: fromUser } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', rating.from_user_id)
        .single();

      return mapRatingToResponse(rating, fromUser);
    })
  );

  return {
    ratings: ratingsWithUsers,
    total: count || 0,
  };
}

/**
 * Get ratings for a specific request
 */
export async function getRequestRatings(requestId: string): Promise<RatingResponse[]> {
  const supabase = getSupabaseAdmin();

  const { data: ratings, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('request_id', requestId);

  if (error) {
    logger.error('Error fetching request ratings:', error);
    throw createError.internal('Failed to fetch ratings');
  }

  // Get user details for each rating
  const ratingsWithUsers = await Promise.all(
    (ratings || []).map(async (rating) => {
      const { data: fromUser } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .eq('id', rating.from_user_id)
        .single();

      return mapRatingToResponse(rating, fromUser);
    })
  );

  return ratingsWithUsers;
}

/**
 * Get rating statistics for a user
 */
export async function getRatingStats(userId: string): Promise<RatingStats> {
  const supabase = getSupabaseAdmin();

  const { data: ratings, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('to_user_id', userId);

  if (error) {
    logger.error('Error fetching rating stats:', error);
    throw createError.internal('Failed to fetch rating statistics');
  }

  const allRatings = ratings || [];
  const totalRatings = allRatings.length;

  // Calculate average
  const averageRating = totalRatings > 0
    ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings) * 10) / 10
    : 0;

  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as { 1: number; 2: number; 3: number; 4: number; 5: number };
  allRatings.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    }
  });

  return {
    userId,
    averageRating,
    totalRatings,
    ratingDistribution: distribution,
  };
}

/**
 * Map database rating to API response format
 */
function mapRatingToResponse(
  rating: Rating,
  fromUser?: { id: string; full_name: string; avatar_url: string | null } | null
): RatingResponse {
  return {
    id: rating.id,
    requestId: rating.request_id,
    fromUserId: rating.from_user_id,
    toUserId: rating.to_user_id,
    rating: rating.rating,
    comment: rating.comment,
    createdAt: rating.created_at,
    fromUser: fromUser ? {
      id: fromUser.id,
      fullName: fromUser.full_name,
      avatarUrl: fromUser.avatar_url,
    } : undefined,
  };
}
