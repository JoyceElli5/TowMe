/**
 * Realtime Service
 * Handles Supabase realtime subscriptions
 */

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  status: RequestStatus;
  [key: string]: any;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Subscribe to changes on a specific tow request
 */
export function subscribeTowRequest(
  requestId: string,
  onUpdate: (payload: TowRequest) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`tow_request:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tow_requests',
        filter: `id=eq.${requestId}`,
      },
      (payload) => {
        onUpdate(payload.new as TowRequest);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to all tow requests for current user
 */
export function subscribeUserTowRequests(
  userId: string,
  onUpdate: (payload: TowRequest) => void,
  onInsert?: (payload: TowRequest) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`user_requests:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tow_requests',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onUpdate(payload.new as TowRequest);
      }
    );

  if (onInsert) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'tow_requests',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onInsert(payload.new as TowRequest);
      }
    );
  }

  channel.subscribe();
  return channel;
}

/**
 * Subscribe to notifications for current user
 */
export function subscribeNotifications(
  userId: string,
  onInsert: (payload: Notification) => void
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
      (payload) => {
        onInsert(payload.new as Notification);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll(): Promise<void> {
  await supabase.removeAllChannels();
}
