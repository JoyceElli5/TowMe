/**
 * Ratings API
 */

import api from './client';

// Types
export interface Rating {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  fromUser?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface RatingStats {
  userId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateRatingData {
  requestId: string;
  toUserId: string;
  rating: number;
  comment?: string;
}

// Rating API functions
export async function createRating(data: CreateRatingData): Promise<Rating> {
  const response = await api.post<Rating>('/ratings', data);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to submit rating');
}

export async function getUserRatings(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ ratings: Rating[]; total: number }> {
  const response = await api.get<{ ratings: Rating[]; total: number }>(
    `/ratings/user/${userId}`,
    { page, limit }
  );
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch ratings');
}

export async function getRequestRatings(requestId: string): Promise<Rating[]> {
  const response = await api.get<Rating[]>(`/ratings/request/${requestId}`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch ratings');
}

export async function getRatingStats(userId: string): Promise<RatingStats> {
  const response = await api.get<RatingStats>(`/ratings/stats/${userId}`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch rating stats');
}
