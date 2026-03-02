/**
 * useActiveRequest
 *
 * Centralized hook for loading and tracking the user's active towing request.
 * - Loads current user via backend API
 * - Fetches recent requests and finds the first active one
 * - Subscribes to user requests in realtime and refreshes when they change
 * - Falls back to periodic polling if realtime fails
 */

import { useEffect, useState } from 'react';

import {
  ApiError,
  getCurrentUser,
  getUserRequests,
  type TowingRequest,
} from '@/lib/api';
import {
  subscribeToUserRequests,
  unsubscribe,
} from '@/lib/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseActiveRequestResult {
  activeRequest: TowingRequest | null;
}

export function useActiveRequest(): UseActiveRequestResult {
  const [activeRequest, setActiveRequest] = useState<TowingRequest | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    let channel: RealtimeChannel | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const loadSession = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !mounted) return;

        const response = await getUserRequests(user.id, {
          limit: 10,
        });

        if (!mounted) return;

        const activeStatuses: Array<'pending' | 'accepted' | 'in_progress'> = [
          'pending',
          'accepted',
          'in_progress',
        ];

        const activeReq = response.data?.find((req) =>
          activeStatuses.includes(req.status as any),
        );

        if (activeReq) {
          setActiveRequest(activeReq);
        } else {
          setActiveRequest(null);
        }
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiError) {
          console.error('Error loading active request session:', error.message);
        } else {
          console.error('Error loading active request session:', error);
        }
      }
    };

    // Initial load
    loadSession();

    const setupRealtime = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !mounted) return;

        channel = subscribeToUserRequests(user.id, (payload) => {
          if (!mounted) return;

          console.log('Request update received:', payload.eventType);

          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE' ||
            payload.eventType === 'DELETE'
          ) {
            loadSession();
          }
        });
      } catch (error) {
        console.error(
          'Error setting up realtime subscription for active request:',
          error,
        );
        if (mounted) {
          fallbackInterval = setInterval(loadSession, 30000);
        }
      }
    };

    setupRealtime();

    // Backup polling
    const backupInterval = setInterval(() => {
      if (mounted) {
        loadSession();
      }
    }, 60000);

    return () => {
      mounted = false;
      if (channel) {
        unsubscribe(channel);
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      clearInterval(backupInterval);
    };
  }, []);

  return { activeRequest };
}


