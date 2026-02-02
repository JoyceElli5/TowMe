/**
 * Driver Matching Service
 * Automatically matches towing requests with available operators
 */

import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import * as notificationsService from './notification.service';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest available operator for a request
 */
export async function findNearestOperator(
  pickupLat: number,
  pickupLng: number
): Promise<{ operatorId: string; distance: number } | null> {
  const supabase = getSupabaseAdmin();

  // Get all online operators
  const { data: operators, error: operatorsError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'tow_operator')
    .eq('is_online', true);

  if (operatorsError) {
    logger.error('Error fetching operators:', operatorsError);
    throw createError.internal('Failed to fetch operators');
  }

  if (!operators || operators.length === 0) {
    logger.info('No online operators available');
    return null;
  }

  // Get latest location for each operator and check if they're available
  const operatorDistances: Array<{ operatorId: string; distance: number }> = [];

  for (const operator of operators) {
    // Check if operator has an active job
    const { data: activeJob } = await supabase
      .from('towing_requests')
      .select('id')
      .eq('operator_id', operator.id)
      .in('status', ['accepted', 'in_progress'])
      .limit(1)
      .single();

    if (activeJob) {
      // Operator is busy, skip
      continue;
    }

    // Get operator's latest location
    const { data: location } = await supabase
      .from('operator_locations')
      .select('latitude, longitude, last_seen, is_available, timestamp')
      .eq('operator_id', operator.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!location) {
      // Operator has no location data, skip
      continue;
    }

    // Check if location is recent (within last 5 minutes) and operator is available
    const lastSeen = new Date(location.last_seen || location.timestamp);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (lastSeen < fiveMinutesAgo) {
      // Location is too old, skip
      continue;
    }

    // Check availability flag if it exists
    if (location.is_available === false) {
      continue;
    }

    // Calculate distance from operator to pickup location
    const distance = haversineDistance(
      parseFloat(location.latitude.toString()),
      parseFloat(location.longitude.toString()),
      pickupLat,
      pickupLng
    );

    operatorDistances.push({
      operatorId: operator.id,
      distance,
    });
  }

  if (operatorDistances.length === 0) {
    logger.info('No available operators found');
    return null;
  }

  // Sort by distance and return the nearest
  operatorDistances.sort((a, b) => a.distance - b.distance);
  return operatorDistances[0];
}

/**
 * Automatically assign an operator to a request
 */
export async function autoAssignOperator(
  requestId: string,
  pickupLat: number,
  pickupLng: number
): Promise<{ operatorId: string; distance: number } | null> {
  const supabase = getSupabaseAdmin();

  // Find nearest operator
  const match = await findNearestOperator(pickupLat, pickupLng);

  if (!match) {
    logger.info(`No operator available for request ${requestId}`);
    return null;
  }

  // Assign operator to request
  const { data: request, error: updateError } = await supabase
    .from('towing_requests')
    .update({
      operator_id: match.operatorId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('user_id')
    .single();

  if (updateError || !request) {
    logger.error('Error assigning operator:', updateError);
    throw createError.internal('Failed to assign operator');
  }

  // Create notification for user
  try {
    await notificationsService.createNotification(
      request.user_id,
      'Operator Assigned',
      'A tow operator has been assigned to your request and is on the way!',
      'status_update',
      {
        requestId,
        operatorId: match.operatorId,
      }
    );
  } catch (error) {
    // Don't fail if notification creation fails
    logger.error('Error creating notification:', error);
  }

  logger.info(`Assigned operator ${match.operatorId} to request ${requestId} (distance: ${match.distance.toFixed(2)} km)`);

  return match;
}

