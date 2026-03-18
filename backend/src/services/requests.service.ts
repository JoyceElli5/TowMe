import { v4 as uuidv4 } from 'uuid';
import { REQUEST_STATUS } from '../config/constants';
import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import type { CreateTowingRequest, PaginatedResponse, TowingRequestFilters, TowingRequestResponse } from '../types/api.types';
import type { TowingRequest } from '../types/database.types';
import { calculateDistance } from '../utils/distance.calculator';
import logger from '../utils/logger';
import { calculateEstimatedPrice, calculateFinalPrice } from '../utils/price.calculator';
import * as matchingService from './matching.service';
import { incrementUserTrips } from './users.service';

/**
 * Create a new towing request.
 * Supports optional idempotencyKey to prevent duplicate requests on network retries.
 */
export async function createRequest(
  userId: string,
  data: CreateTowingRequest,
  idempotencyKey?: string
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Idempotency: if the client sent the same key before, return the existing request
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('towing_requests')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .eq('user_id', userId)
      .single();

    if (existing) {
      logger.info({ requestId: existing.id, idempotencyKey }, 'Returning existing request for idempotency key');
      return existing;
    }
  }

  // Check if user already has an active request
  const { data: activeRequest } = await supabase
    .from('towing_requests')
    .select('id, status, created_at')
    .eq('user_id', userId)
    .in('status', ['pending', 'accepted', 'in_progress'])
    .single();

  if (activeRequest) {
    const createdAt = new Date(activeRequest.created_at).getTime();
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;
    const sixHoursAgo = now - 6 * 60 * 60 * 1000;

    if (activeRequest.status === 'pending') {
      if (createdAt < fifteenMinutesAgo) {
        logger.info({ requestId: activeRequest.id, fromStatus: 'pending', toStatus: 'cancelled', actorId: 'system' },
          'Auto-cancelling stale pending request');

        await supabase
          .from('towing_requests')
          .update({
            status: REQUEST_STATUS.CANCELLED,
            cancellation_reason: 'Auto-cancelled due to timeout',
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeRequest.id);
      } else {
        throw createError.conflict('You already have an active request');
      }
    } else {
      if (createdAt < sixHoursAgo) {
        logger.info({ requestId: activeRequest.id, fromStatus: activeRequest.status, toStatus: 'cancelled', actorId: 'system' },
          'Auto-closing stale active request');

        await supabase
          .from('towing_requests')
          .update({
            status: REQUEST_STATUS.CANCELLED,
            cancellation_reason: 'Auto-cancelled due to inactivity',
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeRequest.id);
      } else {
        throw createError.conflict('You already have an active request');
      }
    }
  }

  // Calculate distance
  const distanceKm = calculateDistance(
    data.pickupLat,
    data.pickupLng,
    data.destinationLat,
    data.destinationLng
  );

  // Calculate estimated price (now async - fetches from database)
  const estimatedPrice = await calculateEstimatedPrice(distanceKm, data.vehicleType);

  // Create request
  const insertData: Record<string, unknown> = {
    id: uuidv4(),
    user_id: userId,
    pickup_address: data.pickupAddress,
    destination_address: data.destinationAddress,
    pickup_lat: data.pickupLat,
    pickup_lng: data.pickupLng,
    destination_lat: data.destinationLat,
    destination_lng: data.destinationLng,
    vehicle_type: data.vehicleType,
    estimated_price: estimatedPrice,
    distance_km: distanceKm,
    status: REQUEST_STATUS.PENDING,
  };

  if (idempotencyKey) {
    insertData.idempotency_key = idempotencyKey;
  }

  const { data: request, error } = await supabase
    .from('towing_requests')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    logger.error('Error creating request:', error);
    throw createError.internal('Failed to create request');
  }

  logger.info({ requestId: request.id, fromStatus: null, toStatus: 'pending', actorId: userId },
    'Request created');

  // Notify all online operators about the new request (fire-and-forget)
  (async () => {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: onlineOperators } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'tow_operator')
        .eq('is_online', true);

      if (onlineOperators && onlineOperators.length > 0) {
        const { notifyUser } = await import('./notification.service');
        const distanceKm = request.distance_km?.toFixed(1) ?? '?';
        await Promise.allSettled(
          onlineOperators.map(op =>
            notifyUser(
              op.id,
              'New Tow Request! 🔔',
              `New ${request.vehicle_type} towing request, ${distanceKm}km trip. Tap to view.`,
              'request',
              { requestId: request.id }
            )
          )
        );
      }
    } catch (err) {
      logger.warn('Failed to notify operators of new request:', err);
    }
  })();

  // Attempt to automatically assign an operator
  matchingService.autoAssignOperator(request.id, data.pickupLat, data.pickupLng)
    .then((match) => {
      if (match) {
        logger.info(`Auto-assigned operator ${match.operatorId} to request ${request.id}`);
      } else {
        logger.info(`No operator available for request ${request.id}, keeping as pending`);
      }
    })
    .catch((error) => {
      logger.error('Error in auto-assignment:', error);
    });

  return request;
}

/**
 * Get request by ID
 */
export async function getRequestById(requestId: string): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  const { data: request, error } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error || !request) {
    throw createError.notFound('Request not found');
  }

  return request;
}

/**
 * Get request with user and operator details.
 * If userId is provided, only returns the request when the user is the owner or assigned operator; otherwise 403.
 */
export async function getRequestWithDetails(
  requestId: string,
  userId?: string
): Promise<TowingRequestResponse> {
  const supabase = getSupabaseAdmin();

  const { data: request, error } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error || !request) {
    throw createError.notFound('Request not found');
  }

  if (userId != null && request.user_id !== userId && request.operator_id !== userId) {
    throw createError.forbidden('You do not have access to this request');
  }

  // Get user details
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, phone, avatar_url, average_rating')
    .eq('id', request.user_id)
    .single();

  // Get operator details if assigned
  let operator = null;
  if (request.operator_id) {
    const { data: op } = await supabase
      .from('users')
      .select('id, full_name, phone, avatar_url, average_rating')
      .eq('id', request.operator_id)
      .single();
    operator = op;
  }

  return mapRequestToResponse(request, user, operator);
}

/**
 * Get all requests with filters.
 * When userId is provided, returns only requests where the user is the owner or assigned operator.
 */
export async function getRequests(
  filters: TowingRequestFilters,
  userId: string
): Promise<PaginatedResponse<TowingRequestResponse>> {
  const supabase = getSupabaseAdmin();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('towing_requests')
    .select('*', { count: 'exact' })
    .or(`user_id.eq.${userId},operator_id.eq.${userId}`);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.vehicleType) {
    query = query.eq('vehicle_type', filters.vehicleType);
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: requests, error, count } = await query;

  if (error) {
    logger.error('Error fetching requests:', error);
    throw createError.internal('Failed to fetch requests');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // Map to response format (without user/operator details for list view)
  const mappedRequests = (requests || []).map(r => mapRequestToResponse(r));

  return {
    data: mappedRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Get pending requests (for operators)
 */
export async function getPendingRequests(operatorId?: string): Promise<TowingRequest[]> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('towing_requests')
    .select('*')
    .eq('status', REQUEST_STATUS.PENDING)
    .order('created_at', { ascending: true })
    .limit(100); // Cap results to avoid unbounded queries at scale

  if (operatorId) {
    query = query.or(`operator_id.is.null,operator_id.eq.${operatorId}`);
  } else {
    query = query.is('operator_id', null);
  }

  const { data: requests, error } = await query;

  if (error) {
    logger.error('Error fetching pending requests:', error);
    throw createError.internal('Failed to fetch pending requests');
  }

  return requests || [];
}

/**
 * Get user's request history
 */
export async function getUserRequests(
  userId: string,
  filters: TowingRequestFilters
): Promise<PaginatedResponse<TowingRequestResponse>> {
  const supabase = getSupabaseAdmin();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('towing_requests')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: requests, error, count } = await query;

  if (error) {
    logger.error('Error fetching user requests:', error);
    throw createError.internal('Failed to fetch requests');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (requests || []).map(r => mapRequestToResponse(r)),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Get operator's jobs
 */
export async function getOperatorRequests(
  operatorId: string,
  filters: TowingRequestFilters
): Promise<PaginatedResponse<TowingRequestResponse>> {
  const supabase = getSupabaseAdmin();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('towing_requests')
    .select('*', { count: 'exact' })
    .eq('operator_id', operatorId);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: requests, error, count } = await query;

  if (error) {
    logger.error('Error fetching operator requests:', error);
    throw createError.internal('Failed to fetch requests');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (requests || []).map(r => mapRequestToResponse(r)),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Accept a request (operator).
 * Uses a single atomic UPDATE ... WHERE id = ? AND status = 'pending' to avoid race conditions.
 */
export async function acceptRequest(
  requestId: string,
  operatorId: string
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Check if operator has an active job (before attempting accept)
  const { data: activeJob } = await supabase
    .from('towing_requests')
    .select('id')
    .eq('operator_id', operatorId)
    .in('status', ['accepted', 'in_progress'])
    .single();

  if (activeJob) {
    throw createError.conflict('You already have an active job');
  }

  // Verify operator is online and is a tow_operator
  const { data: operator } = await supabase
    .from('users')
    .select('is_online, role')
    .eq('id', operatorId)
    .single();

  if (!operator || operator.role !== 'tow_operator') {
    throw createError.forbidden('Only operators can accept requests');
  }

  if (!operator.is_online) {
    throw createError.forbidden('You must be online to accept requests');
  }

  // Atomic accept: only update if request is still pending (prevents double-accept race)
  const { data: updatedRequest, error } = await supabase
    .from('towing_requests')
    .update({
      operator_id: operatorId,
      status: REQUEST_STATUS.ACCEPTED,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', REQUEST_STATUS.PENDING)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      const { data: existing } = await supabase
        .from('towing_requests')
        .select('id, status')
        .eq('id', requestId)
        .single();
      if (!existing) {
        throw createError.notFound('Request not found');
      }
      throw createError.conflict('Request is no longer available');
    }
    logger.error('Error accepting request:', error);
    throw createError.internal('Failed to accept request');
  }

  logger.info({ requestId, fromStatus: 'pending', toStatus: 'accepted', actorId: operatorId },
    'Request accepted');

  // Notify the vehicle owner that their request was accepted
  try {
    const { data: operator } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', operatorId)
      .single();
    const { notifyUser, notificationTemplates } = await import('./notification.service');
    const tmpl = notificationTemplates.requestAccepted(operator?.full_name ?? 'A tow operator');
    await notifyUser(updatedRequest.user_id, tmpl.title, tmpl.message, tmpl.type, { requestId });
  } catch (err) {
    logger.warn('Failed to send accept notification:', err);
  }

  return updatedRequest;
}

/**
 * Decline a request (operator)
 */
export async function declineRequest(
  requestId: string,
  operatorId: string
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Verify request is pending and assigned to this operator
  const { data: request } = await supabase
    .from('towing_requests')
    .select('status, operator_id')
    .eq('id', requestId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  if (request.status !== REQUEST_STATUS.PENDING) {
    throw createError.conflict('Request is no longer pending/available');
  }

  if (request.operator_id !== operatorId) {
    throw createError.conflict('Request is not assigned to you or already taken');
  }

  // Set the request back to broadcast mode (operator_id = null)
  const { data: updatedRequest, error } = await supabase
    .from('towing_requests')
    .update({
      operator_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    logger.error('Error declining request:', error);
    throw createError.internal('Failed to decline request');
  }

  // Broadcast to all other online operators
  const { data: onlineOperators } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'tow_operator')
    .eq('is_online', true)
    .neq('id', operatorId);

  if (onlineOperators && onlineOperators.length > 0) {
    const notificationsService = await import('./notification.service');
    const notifications = onlineOperators.map(op =>
      notificationsService.createNotification(
        op.id,
        'New Job Available! 🔔',
        `A ${updatedRequest.vehicle_type} towing request was just released. First to accept gets it! Distance: ${updatedRequest.distance_km.toFixed(1)}km.`,
        'request',
        { requestId }
      )
    );

    try {
      await Promise.allSettled(notifications);
      logger.info(`Broadcasted declined request ${requestId} to ${onlineOperators.length} operators`);
    } catch (err) {
      logger.error('Error broadcasting notifications on decline:', err);
    }
  }

  return updatedRequest;
}

/**
 * Start towing (operator arrived and loaded)
 */
export async function startRequest(
  requestId: string,
  operatorId: string
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Verify request belongs to operator and is accepted
  const { data: request } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', requestId)
    .eq('operator_id', operatorId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  if (request.status !== REQUEST_STATUS.ACCEPTED) {
    throw createError.conflict('Request must be accepted before starting');
  }

  const { data: updatedRequest, error } = await supabase
    .from('towing_requests')
    .update({
      status: REQUEST_STATUS.IN_PROGRESS,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    logger.error('Error starting request:', error);
    throw createError.internal('Failed to start request');
  }

  logger.info({ requestId, fromStatus: 'accepted', toStatus: 'in_progress', actorId: operatorId },
    'Trip started');

  // Notify the vehicle owner that the operator has arrived
  try {
    const { data: operator } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', operatorId)
      .single();
    const { notifyUser, notificationTemplates } = await import('./notification.service');
    const tmpl = notificationTemplates.operatorArrived(operator?.full_name ?? 'Your operator');
    await notifyUser(request.user_id, tmpl.title, tmpl.message, tmpl.type, { requestId });
  } catch (err) {
    logger.warn('Failed to send arrived notification:', err);
  }

  return updatedRequest;
}

/**
 * Complete a request
 */
export async function completeRequest(
  requestId: string,
  operatorId: string
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Verify request belongs to operator and is in progress
  const { data: request } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', requestId)
    .eq('operator_id', operatorId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  if (request.status !== REQUEST_STATUS.IN_PROGRESS) {
    throw createError.conflict('Request must be in progress to complete');
  }

  // Calculate final price (could include additional charges in future)
  const finalPrice = await calculateFinalPrice(request.distance_km, request.vehicle_type);

  const { data: updatedRequest, error } = await supabase
    .from('towing_requests')
    .update({
      status: REQUEST_STATUS.COMPLETED,
      final_price: finalPrice,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    logger.error('Error completing request:', error);
    throw createError.internal('Failed to complete request');
  }

  logger.info({ requestId, fromStatus: 'in_progress', toStatus: 'completed', actorId: operatorId, finalPrice },
    'Trip completed');

  // Increment trip counts for both user and operator
  await Promise.all([
    incrementUserTrips(request.user_id),
    incrementUserTrips(operatorId),
  ]);

  // Notify both parties that the trip is complete
  try {
    const { notifyUser, notificationTemplates } = await import('./notification.service');
    const userTmpl = notificationTemplates.tripCompleted(finalPrice);
    const operatorTmpl = notificationTemplates.paymentReceived(finalPrice);
    await Promise.allSettled([
      notifyUser(request.user_id, userTmpl.title, userTmpl.message, userTmpl.type, { requestId }),
      notifyUser(operatorId, operatorTmpl.title, operatorTmpl.message, operatorTmpl.type, { requestId }),
    ]);
  } catch (err) {
    logger.warn('Failed to send completion notifications:', err);
  }

  return updatedRequest;
}

/**
 * Cancel a request
 */
export async function cancelRequest(
  requestId: string,
  userId: string,
  reason?: string
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Get request
  const { data: request } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  // Verify user can cancel (user who created or assigned operator)
  if (request.user_id !== userId && request.operator_id !== userId) {
    throw createError.forbidden('You cannot cancel this request');
  }

  // Can only cancel if not completed
  if (request.status === REQUEST_STATUS.COMPLETED) {
    throw createError.conflict('Cannot cancel a completed request');
  }

  if (request.status === REQUEST_STATUS.CANCELLED) {
    throw createError.conflict('Request is already cancelled');
  }

  // Atomic cancel: works even if status changed between read and update.
  // Cancel wins for pending/accepted (user-initiated cancellation takes priority).
  const { data: updatedRequest, error } = await supabase
    .from('towing_requests')
    .update({
      status: REQUEST_STATUS.CANCELLED,
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .in('status', ['pending', 'accepted', 'in_progress'])
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Request was already completed or cancelled between our read and update
      throw createError.conflict('Request can no longer be cancelled');
    }
    logger.error('Error cancelling request:', error);
    throw createError.internal('Failed to cancel request');
  }

  logger.info({ requestId, fromStatus: request.status, toStatus: 'cancelled', actorId: userId, reason },
    'Request cancelled');

  return updatedRequest;
}

/**
 * Map database request to API response format
 */
function mapRequestToResponse(
  request: TowingRequest,
  user?: { id: string; full_name: string; phone: string; avatar_url: string | null; average_rating: number } | null,
  operator?: { id: string; full_name: string; phone: string; avatar_url: string | null; average_rating: number } | null
): TowingRequestResponse {
  return {
    id: request.id,
    userId: request.user_id,
    operatorId: request.operator_id,
    pickupAddress: request.pickup_address,
    destinationAddress: request.destination_address,
    pickupLat: request.pickup_lat,
    pickupLng: request.pickup_lng,
    destinationLat: request.destination_lat,
    destinationLng: request.destination_lng,
    vehicleType: request.vehicle_type,
    estimatedPrice: request.estimated_price,
    finalPrice: request.final_price,
    distanceKm: request.distance_km,
    status: request.status,
    cancellationReason: request.cancellation_reason,
    createdAt: request.created_at,
    acceptedAt: request.accepted_at,
    startedAt: request.started_at,
    completedAt: request.completed_at,
    user: user ? {
      id: user.id,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      averageRating: user.average_rating,
    } : undefined,
    operator: operator ? {
      id: operator.id,
      fullName: operator.full_name,
      phone: operator.phone,
      avatarUrl: operator.avatar_url,
      averageRating: operator.average_rating,
    } : null,
  };
}
