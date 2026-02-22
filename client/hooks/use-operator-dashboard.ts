import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useRealtimeRequests } from '@/hooks/use-realtime-requests';
import { useToast } from '@/hooks/use-toast';
import {
  acceptRequest,
  ApiError,
  getCurrentUser,
  getOperatorRequests,
  type TowingRequest
} from '@/lib/api';
import { toggleOperatorOnlineStatus } from '@/lib/api/users';

interface OperatorDashboardState {
  isOnline: boolean;
  earnings: number;
  tripsToday: number;
  rating: number;
  isLoadingStatus: boolean;
  incomingRequest: TowingRequest | null;
  activeJob: TowingRequest | null;
  isAccepting: boolean;
  requestTimeLeft: number;
}

export function useOperatorDashboard() {
  const { showToast } = useToast();

  const [state, setState] = useState<OperatorDashboardState>({
    isOnline: false,
    earnings: 0,
    tripsToday: 0,
    rating: 0,
    isLoadingStatus: false,
    incomingRequest: null,
    activeJob: null,
    isAccepting: false,
    requestTimeLeft: 30,
  });

  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current user and stats
  const fetchUserAndStats = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

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

      if (!tripsResponse.data) return;

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

      // Fetch active job (accepted or in_progress)
      const activeJobs = await getOperatorRequests(user.id, {
        limit: 1,
      });

      const currentActiveJob = activeJobs.data.find(job =>
        job.status === 'accepted' || job.status === 'in_progress'
      );

      if (currentActiveJob) {
        setState(prev => ({ ...prev, activeJob: currentActiveJob }));
      }
    } catch (error) {
      console.error('Failed to load operator dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserAndStats();
  }, [fetchUserAndStats]);

  // Request Timer Logic
  useEffect(() => {
    if (state.incomingRequest && state.requestTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.requestTimeLeft <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return { ...prev, incomingRequest: null, requestTimeLeft: 0 };
          }
          return { ...prev, requestTimeLeft: prev.requestTimeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.incomingRequest, state.requestTimeLeft]);

  const { pendingRequests } = useRealtimeRequests();

  // Watch for new requests from the shared hook
  useEffect(() => {
    if (state.isOnline && !state.incomingRequest && pendingRequests.length > 0) {
      setState(prev => ({
        ...prev,
        incomingRequest: pendingRequests[0],
        requestTimeLeft: 30
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [state.isOnline, state.incomingRequest, pendingRequests]);

  const handleOnlineToggle = useCallback(
    async (value: boolean) => {
      if (!currentUser) {
        showToast('Please log in to go online', 'error');
        return;
      }

      if (value) {
        const { isOperatorVerified, getVerificationStatus } = await import('@/lib/services/operatorService');
        const verified = await isOperatorVerified(currentUser.id);
        const verificationStatus = await getVerificationStatus(currentUser.id);

        if (!verified) {
          if (verificationStatus === 'pending' || verificationStatus === 'under_review') {
            showToast('Please complete your profile verification to go online', 'error');
            router.push('/screens/operator/verification-pending');
          } else if (verificationStatus === 'rejected') {
            showToast('Your verification was rejected. Please update your profile', 'error');
            router.push('/screens/operator/verification-rejected');
          } else {
            showToast('Please complete your profile to go online', 'error');
            router.push('/screens/operator/profile-setup-screen');
          }
          return;
        }
      }

      setState((prev) => ({ ...prev, isLoadingStatus: true }));

      try {
        await toggleOperatorOnlineStatus(currentUser.id, value);
        setState((prev) => ({ ...prev, isOnline: value }));
        showToast(value ? 'You are now online' : 'You are now offline', 'success');
        Haptics.selectionAsync();
      } catch (error: any) {
        console.error('Failed to toggle online status:', error);
        showToast(error?.message || 'Could not update status', 'error');
        setState((prev) => ({ ...prev, isOnline: !value }));
      } finally {
        setState((prev) => ({ ...prev, isLoadingStatus: false }));
      }
    },
    [currentUser, showToast]
  );

  const handleAcceptRequest = async () => {
    if (!state.incomingRequest) return;
    setState(prev => ({ ...prev, isAccepting: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await acceptRequest(state.incomingRequest.id);
      const requestId = state.incomingRequest.id;
      setState(prev => ({ ...prev, isAccepting: false, incomingRequest: null }));
      router.push({
        pathname: '/screens/operator/navigation-to-pickup',
        params: { requestId },
      });
    } catch (error) {
      console.error('Failed to accept request:', error);
      setState(prev => ({ ...prev, isAccepting: false }));
      if (error instanceof ApiError) {
        Alert.alert('Error', error.message || 'Failed to accept request');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    }
  };

  const handleDeclineRequest = () => {
    setState(prev => ({ ...prev, incomingRequest: null }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const simulateRequest = () => {
    const mockRequest: any = {
      id: 'mock-' + Math.random().toString(36).substr(2, 9),
      userId: 'user-1',
      operatorId: null,
      pickupAddress: 'Tetteh Quarshie Interchange, Accra',
      pickupLat: 5.6179,
      pickupLng: -0.1744,
      destinationAddress: 'Kotoka International Airport, Accra',
      destinationLat: 5.6037,
      destinationLng: -0.1691,
      distanceKm: 5.2,
      estimatedPrice: 150,
      status: 'pending',
      createdAt: new Date().toISOString(),
      user: {
        fullName: 'Kwame Mensah',
        averageRating: 4.8,
      }
    };
    setState(prev => ({ ...prev, incomingRequest: mockRequest, requestTimeLeft: 30 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return {
    ...state,
    handleOnlineToggle,
    handleAcceptRequest,
    handleDeclineRequest,
    simulateRequest,
    activeJob: state.activeJob,
    refreshStats: fetchUserAndStats,
  };
}
