import {
  ApiError,
  getCurrentUser,
  getOperatorRequests,
  getUserRequests,
  TowingRequest
} from '@/lib/api';
import { subscribeToOperatorRequests, subscribeToUserRequests, unsubscribe } from '@/lib/services/realtimeService';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export type RequestRole = 'user' | 'operator';

interface UseRequestsResult {
  activeRequests: TowingRequest[];
  pastRequests: TowingRequest[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRequests(role: RequestRole): UseRequestsResult {
  const [activeRequests, setActiveRequests] = useState<TowingRequest[]>([]);
  const [pastRequests, setPastRequests] = useState<TowingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const activeStatuses = role === 'user'
        ? ['pending', 'accepted', 'in_progress']
        : ['accepted', 'in_progress'];
      const pastStatuses = ['completed', 'cancelled'];

      let response;
      if (role === 'user') {
        response = await getUserRequests(user.id, { limit: 50 });
      } else {
        response = await getOperatorRequests(user.id, { limit: 50 });
      }

      if (response.data) {
        const all = response.data;
        setActiveRequests(all.filter(r => activeStatuses.includes(r.status)));
        setPastRequests(all.filter(r => pastStatuses.includes(r.status)));
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchRequests();

    let channel: RealtimeChannel | null = null;
    let mounted = true;

    const setupRealtime = async () => {
      const user = await getCurrentUser();
      if (!user || !mounted) return;

      const callback = () => {
        if (mounted) fetchRequests();
      };

      if (role === 'user') {
        channel = subscribeToUserRequests(user.id, callback);
      } else {
        channel = subscribeToOperatorRequests(user.id, callback);
      }
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (channel) unsubscribe(channel);
    };
  }, [role, fetchRequests]);

  return {
    activeRequests,
    pastRequests,
    isLoading,
    error,
    refresh: fetchRequests
  };
}
