/**
 * useRealtimeRequests
 * 
 * Shared hook for abstracting Supabase realtime subscriptions 
 * to pending job requests.
 */

import { useEffect, useState } from 'react';

import { getPendingRequests, type TowingRequest } from '@/lib/api';
import {
  subscribeToPendingRequests,
  unsubscribe
} from '@/lib/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeRequests() {
  const [pendingRequests, setPendingRequests] = useState<TowingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await getPendingRequests();
      setPendingRequests(data || []);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let backupInterval: NodeJS.Timeout | null = null;

    // Initial fetch
    fetchRequests();

    // Set up realtime subscription
    try {
      channel = subscribeToPendingRequests((payload) => {
        fetchRequests();
      });
    } catch (error) {
      console.error('Realtime subscription error:', error);
      // Fallback to polling if realtime fails
      backupInterval = setInterval(fetchRequests, 15000);
    }

    // Secondary backup polling (standard)
    const standardPolling = setInterval(fetchRequests, 60000);

    return () => {
      if (channel) unsubscribe(channel);
      if (backupInterval) clearInterval(backupInterval);
      clearInterval(standardPolling);
    };
  }, []);

  return {
    pendingRequests,
    isLoading,
    refresh: fetchRequests,
  };
}
