import { v4 as uuidv4 } from 'uuid';
import { REQUEST_STATUS } from '../config/constants';
import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import type { CreateTowingRequest, PaginatedResponse, TowingRequestFilters, TowingRequestResponse } from '../types/api.types';
import type { TowingRequest } from '../types/database.types';
import { calculateDistance } from '../utils/distance.calculator';
import logger from '../utils/logger';
import { calculateEstimatedPrice, calculateFinalPrice } from '../utils/price.calculator';
import { incrementUserTrips } from './users.service';

/**
 * Create a new towing request
 */
export async function createRequest(
  userId: string,
  data: CreateTowingRequest
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Check if user already has an active request
  const { data: activeRequest } = await supabase
    .from('towing_requests')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'accepted', 'in_progress'])
    .single();

  if (activeRequest) {
    throw createError.conflict('You already have an active request');
  }

  // Calculate distance
  const distanceKm = calculateDistance(
    data.pickupLat,
    data.pickupLng,
    data.destinationLat,
    data.destinationLng
  );

  // Calculate estimated price
  const estimatedPrice = calculateEstimatedPrice(distanceKm, data.vehicleType);

  // Create request
  const { data: request, error } = await supabase
    .from('towing_requests')
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating request:', error);
    throw createError.internal('Failed to create request');
  }

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
 * Get request with user and operator details
 */
export async function getRequestWithDetails(requestId: string): Promise<TowingRequestResponse> {
  const supabase = getSupabaseAdmin();

  const { data: request, error } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error || !request) {
    throw createError.notFound('Request not found');
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
 * Get all requests with filters
 */
export async function getRequests(
  filters: TowingRequestFilters
): Promise<PaginatedResponse<TowingRequestResponse>> {
  const supabase = getSupabaseAdmin();
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('towing_requests')
    .select('*', { count: 'exact' });

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
export async function getPendingRequests(): Promise<TowingRequest[]> {
  const supabase = getSupabaseAdmin();

  const { data: requests, error } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('status', REQUEST_STATUS.PENDING)
    .order('created_at', { ascending: true });

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
 * Accept a request (operator)
 */
export async function acceptRequest(
  requestId: string,
  operatorId: string
): Promise<TowingRequest> {
  const supabase = getSupabaseAdmin();

  // Verify request is pending
  const { data: request } = await supabase
    .from('towing_requests')
    .select('status')
    .eq('id', requestId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  if (request.status !== REQUEST_STATUS.PENDING) {
    throw createError.conflict('Request is no longer available');
  }

  // Check if operator has an active job
  const { data: activeJob } = await supabase
    .from('towing_requests')
    .select('id')
    .eq('operator_id', operatorId)
    .in('status', ['accepted', 'in_progress'])
    .single();

  if (activeJob) {
    throw createError.conflict('You already have an active job');
  }

  // Verify operator is online
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

  // Accept the request
  const { data: updatedRequest, error } = await supabase
    .from('towing_requests')
    .update({
      operator_id: operatorId,
      status: REQUEST_STATUS.ACCEPTED,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    logger.error('Error accepting request:', error);
    throw createError.internal('Failed to accept request');
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
  const finalPrice = calculateFinalPrice(request.distance_km, request.vehicle_type);

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

  // Increment trip counts for both user and operator
  await Promise.all([
    incrementUserTrips(request.user_id),
    incrementUserTrips(operatorId),
  ]);

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

  const { data: updatedRequest, error } = await supabase
    .from('towing_requests')
    .update({
      status: REQUEST_STATUS.CANCELLED,
      cancellation_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    logger.error('Error cancelling request:', error);
    throw createError.internal('Failed to cancel request');
  }

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
