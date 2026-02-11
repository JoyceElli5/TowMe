/**
 * useOperatorDashboard
 *
 * Encapsulates operator dashboard data + realtime logic:
 * - Loads current operator (via backend API)
 * - Computes today's trips and total earnings
 * - Subscribes to pending requests in realtime
 * - Exposes online/offline toggle handler
 */

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import {
  getCurrentUser,
  getOperatorRequests,
  getPendingRequests,
} from '@/lib/api';
import { toggleOperatorOnlineStatus } from '@/lib/api/users';
import {
  subscribeToPendingRequests,
  unsubscribe,
} from '@/lib/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface OperatorDashboardState {
  isOnline: boolean;
  earnings: number;
  tripsToday: number;
  rating: number;
  isLoadingStatus: boolean;
}

export function useOperatorDashboard() {
  const { showToast } = useToast();

  const [state, setState] = useState<OperatorDashboardState>({
    isOnline: false,
    earnings: 0,
    tripsToday: 0,
    rating: 0,
    isLoadingStatus: false,
  });

  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Fetch current user and stats on mount
  useEffect(() => {
    let mounted = true;

    const fetchUserAndStats = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !mounted) return;

        setCurrentUser({ id: user.id });

        // Base profile info
        setState((prev) => ({
          ...prev,
          isOnline: (user as any).isOnline || false,
          rating: (user as any).averageRating || 0,
        }));

        // Fetch today's trips and earnings
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tripsResponse = await getOperatorRequests(user.id, {
          status: 'completed',
          limit: 100,
        });

        if (!mounted || !tripsResponse.data) return;

        const todayTrips = tripsResponse.data.filter((trip) => {
          const tripDate = new Date(trip.completedAt || trip.createdAt);
          return tripDate >= today;
        });

        const totalEarnings = tripsResponse.data.reduce((sum, trip) => {
          return sum + (trip.finalPrice || trip.estimatedPrice || 0);
        }, 0);

        setState((prev) => ({
          ...prev,
          tripsToday: todayTrips.length,
          earnings: totalEarnings,
        }));
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to load operator dashboard data:', error);
        showToast('Please log in to continue', 'error');
      }
    };

    fetchUserAndStats();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  // Real-time subscription for pending requests when online
  useEffect(() => {
    if (!state.isOnline || !currentUser) return;

    let channel: RealtimeChannel | null = null;
    let backupInterval: NodeJS.Timeout | null = null;

    const fetchPending = async () => {
      try {
        const requests = await getPendingRequests();
        if (requests && requests.length > 0) {
          router.push({
            pathname: '/screens/operator/incoming-request',
            params: { requestId: requests[0].id },
          });
        }
      } catch (error) {
        console.error('Failed to fetch pending requests:', error);
      }
    };

    // Initial fetch
    fetchPending();

    // Supabase realtime subscription
    try {
      channel = subscribeToPendingRequests((payload) => {
        console.log('New pending request received:', payload.eventType);
        if (payload.eventType === 'INSERT') {
          fetchPending();
        }
      });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      backupInterval = setInterval(fetchPending, 15000);
    }

    // Backup polling (less frequent)
    backupInterval = backupInterval ?? setInterval(fetchPending, 30000);

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
      if (backupInterval) {
        clearInterval(backupInterval);
      }
    };
  }, [state.isOnline, currentUser]);

  const handleOnlineToggle = useCallback(
    async (value: boolean) => {
      if (!currentUser) {
        showToast('Please log in to go online', 'error');
        return;
      }

      setState((prev) => ({ ...prev, isLoadingStatus: true }));

      try {
        await toggleOperatorOnlineStatus(currentUser.id, value);
        setState((prev) => ({ ...prev, isOnline: value }));
        showToast(
          value ? 'You are now online' : 'You are now offline',
          'success',
        );
      } catch (error: any) {
        console.error('Failed to toggle online status:', error);
        showToast(error?.message || 'Could not update status', 'error');
        // Revert on error
        setState((prev) => ({ ...prev, isOnline: !value }));
      } finally {
        setState((prev) => ({ ...prev, isLoadingStatus: false }));
      }
    },
    [currentUser, showToast],
  );

  return {
    ...state,
    handleOnlineToggle,
  };
}


