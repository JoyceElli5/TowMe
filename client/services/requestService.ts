/**
 * Request Service
 * Handles tow request CRUD operations
 */

import { supabase } from '@/lib/supabase';

export type VehicleType = 'car' | 'suv' | 'saloon' | 'van';
export type RequestStatus =
  | 'pending'
  | 'matched'
  | 'driver_enroute'
  | 'towing'
  | 'completed'
  | 'cancelled';

export interface TowRequest {
  id: string;
  user_id: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  dest_lat: number;
  dest_lng: number;
  dest_address?: string;
  vehicle_type: VehicleType;
  estimated_distance_km?: number;
  estimated_cost?: number;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateRequestData {
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  dest_lat: number;
  dest_lng: number;
  dest_address?: string;
  vehicle_type: VehicleType;
  estimated_distance_km?: number;
  estimated_cost?: number;
}

/**
 * Create a new tow request
 */
export async function createTowRequest(
  requestData: CreateRequestData
): Promise<TowRequest> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('tow_requests')
    .insert({
      ...requestData,
      user_id: userId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get a specific tow request
 */
export async function getTowRequest(requestId: string): Promise<TowRequest> {
  const { data, error } = await supabase
    .from('tow_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get all tow requests for current user
 */
export async function getUserTowRequests(): Promise<TowRequest[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('tow_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Update tow request status
 */
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus
): Promise<TowRequest> {
  const { data, error } = await supabase
    .from('tow_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Cancel a tow request
 */
export async function cancelTowRequest(requestId: string): Promise<TowRequest> {
  return updateRequestStatus(requestId, 'cancelled');
}

/**
 * Call the match_driver function to find a driver
 */
export async function matchDriver(requestId: string): Promise<{
  success: boolean;
  driver_id?: string;
  assignment_id?: string;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('match_driver', {
    request_id: requestId,
  });

  if (error) {
    console.error('Error matching driver:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return data;
}
