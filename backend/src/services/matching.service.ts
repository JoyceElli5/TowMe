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
 * Find the nearest available operator for a request.
 * Uses batch queries to avoid N+1: one query for available operators, one for recent locations.
 */
export async function findNearestOperator(
  pickupLat: number,
  pickupLng: number
): Promise<{ operatorId: string; distance: number } | null> {
  const supabase = getSupabaseAdmin();

  // Step 1: Get all online operators
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

  const operatorIds = operators.map(op => op.id);

  // Step 2: Batch-check which operators have active jobs
  const { data: busyOperators } = await supabase
    .from('towing_requests')
    .select('operator_id')
    .in('operator_id', operatorIds)
    .in('status', ['accepted', 'in_progress']);

  const busySet = new Set((busyOperators || []).map(r => r.operator_id));
  const availableIds = operatorIds.filter(id => !busySet.has(id));

  if (availableIds.length === 0) {
    logger.info('All online operators are busy');
    return null;
  }

  // Step 3: Batch-fetch latest locations for available operators
  // Get recent locations (within last 5 minutes) for all available operators at once
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: locations } = await supabase
    .from('operator_locations')
    .select('operator_id, latitude, longitude, last_seen, is_available, timestamp')
    .in('operator_id', availableIds)
    .gte('timestamp', fiveMinutesAgo)
    .order('timestamp', { ascending: false });

  if (!locations || locations.length === 0) {
    logger.info('No recent location data for available operators');
    return null;
  }

  // Take only the latest location per operator
  const latestByOperator = new Map<string, typeof locations[0]>();
  for (const loc of locations) {
    if (!latestByOperator.has(loc.operator_id)) {
      latestByOperator.set(loc.operator_id, loc);
    }
  }

  // Step 4: Calculate distances in-memory
  const operatorDistances: Array<{ operatorId: string; distance: number }> = [];

  for (const [operatorId, location] of latestByOperator) {
    // Check availability flag if it exists
    if (location.is_available === false) {
      continue;
    }

    const distance = haversineDistance(
      parseFloat(location.latitude.toString()),
      parseFloat(location.longitude.toString()),
      pickupLat,
      pickupLng
    );

    operatorDistances.push({ operatorId, distance });
  }

  if (operatorDistances.length === 0) {
    logger.info('No available operators found with recent locations');
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
    logger.info(`No nearest operator available for request ${requestId}, broadcasting to all online operators`);

    // Broadcast to all online operators
    const { data: onlineOperators } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'tow_operator')
      .eq('is_online', true);

    if (onlineOperators && onlineOperators.length > 0) {
      // Get the request details for the notification
      const { data: request } = await supabase
        .from('towing_requests')
        .select('vehicle_type, distance_km')
        .eq('id', requestId)
        .single();

      if (request) {
        const notifications = onlineOperators.map(op =>
          notificationsService.createNotification(
            op.id,
            'New Job Available! 🔔',
            `A new ${request.vehicle_type} towing request is available. Distance: ${request.distance_km.toFixed(1)}km.`,
            'request',
            { requestId }
          )
        );

        try {
          await Promise.allSettled(notifications);
          logger.info(`Broadcasted request ${requestId} to ${onlineOperators.length} operators`);
        } catch (error) {
          logger.error('Error broadcasting notifications:', error);
        }
      }
    }

    return null;
  }

  // Assign operator to request target, but wait for acceptance
  const { data: request, error: updateError } = await supabase
    .from('towing_requests')
    .update({
      operator_id: match.operatorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select('user_id')
    .single();

  if (updateError || !request) {
    logger.error('Error assigning operator:', updateError);
    throw createError.internal('Failed to assign operator');
  }

  // Create notification for the specific assigned operator to accept the job
  try {
    await notificationsService.createNotification(
      match.operatorId,
      'New Job Assigned to You! 🔔',
      'You have 30 seconds to accept this new towing request before it is re-assigned.',
      'request',
      { requestId }
    );
  } catch (error) {
    // Don't fail if notification creation fails
    logger.error('Error creating notification:', error);
  }

  logger.info(`Assigned operator ${match.operatorId} to request ${requestId} (distance: ${match.distance.toFixed(2)} km)`);

  return match;
}

