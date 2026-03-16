/**
 * useActiveRequest
 *
 * Centralized hook for loading and tracking the user's active towing request.
 * - Persists active request ID in secure storage so we can restore quickly on app restart
 * - Loads current user via backend API
 * - Fetches recent requests and finds the first active one
 * - Subscribes to user requests in realtime and refreshes when they change
 * - Falls back to periodic polling if realtime fails
 */

import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import {
  ApiError,
  getCurrentUser,
  getUserRequests,
  getRequestById,
  type TowingRequest,
} from '@/lib/api';
import {
  subscribeToUserRequests,
  unsubscribe,
} from '@/lib/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

const ACTIVE_REQUEST_KEY = 'towme_active_request_id';

interface UseActiveRequestResult {
  activeRequest: TowingRequest | null;
  isError: boolean;
}

export function useActiveRequest(): UseActiveRequestResult {
  const [activeRequest, setActiveRequest] = useState<TowingRequest | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let channel: RealtimeChannel | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const loadFromStorage = async (): Promise<boolean> => {
      try {
        const storedId = await SecureStore.getItemAsync(ACTIVE_REQUEST_KEY);
        if (!storedId) return false;

        const request = await getRequestById(storedId);
        const activeStatuses: Array<'pending' | 'accepted' | 'in_progress'> = [
          'pending',
          'accepted',
          'in_progress',
        ];

        if (!mounted) return true;

        if (activeStatuses.includes(request.status as any)) {
          setActiveRequest(request);
          setIsError(false);
        } else {
          setActiveRequest(null);
          await SecureStore.deleteItemAsync(ACTIVE_REQUEST_KEY);
        }
        return true;
      } catch (error) {
        if (!mounted) return true;
        if (error instanceof ApiError && error.status === 404) {
          // Stored ID no longer valid
          await SecureStore.deleteItemAsync(ACTIVE_REQUEST_KEY);
          setActiveRequest(null);
        } else {
          console.error('Error restoring active request from storage:', error);
          setIsError(true);
        }
        return false;
      }
    };

    const loadSession = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !mounted) return;

        // First try fast-path using stored active request ID
        await loadFromStorage();

        const requests = await getUserRequests(user.id, {
          limit: 10,
        });

        if (!mounted) return;

        const activeStatuses: Array<'pending' | 'accepted' | 'in_progress'> = [
          'pending',
          'accepted',
          'in_progress',
        ];

        const activeReq = requests.find((req) =>
          activeStatuses.includes(req.status as any),
        );

        if (activeReq) {
          setActiveRequest(activeReq);
          await SecureStore.setItemAsync(ACTIVE_REQUEST_KEY, activeReq.id);
        } else {
          setActiveRequest(null);
          await SecureStore.deleteItemAsync(ACTIVE_REQUEST_KEY);
        }
        setIsError(false);
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiError) {
          console.error('Error loading active request session:', error.message);
        } else {
          console.error('Error loading active request session:', error);
        }
        setIsError(true);
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

  return { activeRequest, isError };
}


