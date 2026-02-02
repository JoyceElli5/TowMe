import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to changes on a specific towing request
 */
export function subscribeToRequest(
  requestId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`request:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'towing_requests',
        filter: `id=eq.${requestId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to all requests for a user
 */
export function subscribeToUserRequests(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`user_requests:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'towing_requests',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to pending requests for operators
 */
export function subscribeToPendingRequests(
  callback: (payload: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel('pending_requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'towing_requests',
        filter: 'status=eq.pending',
      },
      callback
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

