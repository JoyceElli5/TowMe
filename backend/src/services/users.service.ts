/**
 * Users Service
 * Handles user profile management and statistics
 */

import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import type { UpdateProfileRequest } from '../types/api.types';
import type { User } from '../types/database.types';
import logger from '../utils/logger';

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User> {
  const supabase = getSupabaseAdmin();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw createError.notFound('User not found');
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileRequest
): Promise<User> {
  const supabase = getSupabaseAdmin();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.fullName) updateData.full_name = updates.fullName;
  if (updates.phone) updateData.phone = updates.phone;
  if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl;

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating user profile:', error);
    throw createError.internal('Failed to update profile');
  }

  return user;
}

/**
 * Update user avatar
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<User> {
  return updateUserProfile(userId, { avatarUrl });
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<{
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  tripsThisMonth: number;
}> {
  const supabase = getSupabaseAdmin();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('total_trips, average_rating')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw createError.notFound('User not found');
  }

  // Get total ratings count
  const { count: totalRatings } = await supabase
    .from('ratings')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', userId);

  // Get trips this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: tripsThisMonth } = await supabase
    .from('towing_requests')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${userId},operator_id.eq.${userId}`)
    .eq('status', 'completed')
    .gte('completed_at', startOfMonth.toISOString());

  return {
    totalTrips: user.total_trips,
    averageRating: user.average_rating,
    totalRatings: totalRatings || 0,
    tripsThisMonth: tripsThisMonth || 0,
  };
}

/**
 * Toggle operator online status
 */
export async function toggleOperatorOnlineStatus(
  operatorId: string,
  isOnline: boolean
): Promise<User> {
  const supabase = getSupabaseAdmin();

  // Verify user is an operator
  const { data: operator, error: fetchError } = await supabase
    .from('users')
    .select('role')
    .eq('id', operatorId)
    .single();

  if (fetchError || !operator) {
    throw createError.notFound('Operator not found');
  }

  if (operator.role !== 'tow_operator') {
    throw createError.forbidden('Only operators can toggle online status');
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({
      is_online: isOnline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', operatorId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating operator status:', error);
    throw createError.internal('Failed to update status');
  }

  return user;
}

/**
 * Get online operators (for request matching)
 */
export async function getOnlineOperators(): Promise<User[]> {
  const supabase = getSupabaseAdmin();

  const { data: operators, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'tow_operator')
    .eq('is_online', true);

  if (error) {
    logger.error('Error fetching online operators:', error);
    throw createError.internal('Failed to fetch operators');
  }

  return operators || [];
}

/**
 * Update user rating average
 */
export async function updateUserRating(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Calculate new average
  const { data: ratings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('to_user_id', userId);

  if (!ratings || ratings.length === 0) {
    return;
  }

  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = Math.round((totalRating / ratings.length) * 10) / 10;

  await supabase
    .from('users')
    .update({ average_rating: averageRating })
    .eq('id', userId);
}

/**
 * Increment user total trips
 */
export async function incrementUserTrips(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: user } = await supabase
    .from('users')
    .select('total_trips')
    .eq('id', userId)
    .single();

  if (user) {
    await supabase
      .from('users')
      .update({ total_trips: user.total_trips + 1 })
      .eq('id', userId);
  }
}

/**
 * Update operator location
 */
export async function updateOperatorLocation(
  operatorId: string,
  location: { latitude: number; longitude: number; heading: number | null }
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Upsert location in operator_locations table
  const { error } = await supabase
    .from('operator_locations')
    .upsert({
      operator_id: operatorId,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading,
      timestamp: new Date().toISOString(),
    }, {
      onConflict: 'operator_id',
    });

  if (error) {
    logger.error('Error updating operator location:', error);
    throw createError.internal('Failed to update operator location');
  }
}

/**
 * Get latest operator location
 */
export async function getOperatorLocation(operatorId: string): Promise<{
  latitude: number;
  longitude: number;
  heading: number | null;
  timestamp: string;
} | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('operator_locations')
    .select('latitude, longitude, heading, timestamp')
    .eq('operator_id', operatorId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Location not found - return null (not an error, operator may not have started tracking)
    return null;
  }

  return {
    latitude: parseFloat(data.latitude.toString()),
    longitude: parseFloat(data.longitude.toString()),
    heading: data.heading ? parseFloat(data.heading.toString()) : null,
    timestamp: data.timestamp,
  };
}