/**
 * Users API
 */

import api from './client';
import type { User } from './auth';

// Types
export interface UserStats {
  totalTrips: number;
  averageRating: number;
  totalRatings: number;
  tripsThisMonth: number;
}

// User API functions
export async function getUserById(userId: string): Promise<User> {
  const response = await api.get<User>(`/users/${userId}`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch user');
}

export async function updateUserProfile(
  userId: string,
  data: { fullName?: string; phone?: string }
): Promise<User> {
  const response = await api.patch<User>(`/users/${userId}`, data);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to update profile');
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<{ avatarUrl: string }> {
  const response = await api.patch<{ avatarUrl: string }>(`/users/${userId}/avatar`, { avatarUrl });
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to update avatar');
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const response = await api.get<UserStats>(`/users/${userId}/stats`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch user stats');
}

export async function toggleOperatorOnlineStatus(
  operatorId: string,
  isOnline: boolean
): Promise<{ isOnline: boolean }> {
  const response = await api.patch<{ isOnline: boolean }>(`/operators/${operatorId}/online-status`, {
    isOnline,
  });
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to update status');
}
