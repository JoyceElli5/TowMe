/**
 * Trip History Service
 * Handles trip history operations
 */

import { supabase } from '@/lib/supabase';

export interface TripHistory {
  id: string;
  request_id: string;
  user_id: string;
  driver_id?: string;
  final_distance_km?: number;
  final_cost?: number;
  rating?: number;
  created_at: string;
}

export interface TripWithDetails extends TripHistory {
  tow_request?: {
    pickup_address?: string;
    dest_address?: string;
    vehicle_type: string;
    status: string;
  };
}

/**
 * Get trip history for current user
 */
export async function getUserTripHistory(): Promise<TripWithDetails[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('trip_history')
    .select(`
      *,
      tow_request:tow_requests(
        pickup_address,
        dest_address,
        vehicle_type,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get trip history by request ID
 */
export async function getTripByRequestId(requestId: string): Promise<TripHistory | null> {
  const { data, error } = await supabase
    .from('trip_history')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error) {
    console.error('Error fetching trip:', error);
    return null;
  }

  return data;
}

/**
 * Get completed tow requests (alternative to trip_history)
 */
export async function getCompletedRequests() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('tow_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
