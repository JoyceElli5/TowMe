/**
 * Towing Requests API
 */

import api, { PaginatedResponse } from './client';

// Types
export type VehicleType = 'car' | 'suv' | 'saloon' | 'van' | 'truck' | 'motorcycle' | 'others';
export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface TowingRequest {
  id: string;
  userId: string;
  operatorId: string | null;
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  vehicleType: VehicleType;
  estimatedPrice: number;
  finalPrice: number | null;
  distanceKm: number;
  status: RequestStatus;
  cancellationReason: string | null;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  user?: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl: string | null;
    averageRating: number;
  };
  operator?: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl: string | null;
    averageRating: number;
  } | null;
}

export interface CreateTowingRequestData {
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  vehicleType: VehicleType;
}

export interface RequestFilters {
  status?: RequestStatus;
  vehicleType?: VehicleType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PriceEstimate {
  distanceKm: number;
  basePrice: number;
  vehicleMultiplier: number;
  estimatedPrice: number;
  currency: string;
}

// Request API functions
export async function createRequest(data: CreateTowingRequestData): Promise<TowingRequest> {
  const response = await api.post<TowingRequest>('/requests', data);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to create request');
}

export async function getRequests(filters?: RequestFilters): Promise<PaginatedResponse<TowingRequest>> {
  const response = await api.get<PaginatedResponse<TowingRequest>>('/requests', filters as Record<string, string | number | undefined>);
  if (response.data) {
    return response.data as unknown as PaginatedResponse<TowingRequest>;
  }
  throw new Error(response.error || 'Failed to fetch requests');
}

export async function getRequestById(id: string): Promise<TowingRequest> {
  const response = await api.get<TowingRequest>(`/requests/${id}`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch request');
}

export async function getUserRequests(userId: string, filters?: RequestFilters): Promise<PaginatedResponse<TowingRequest>> {
  const response = await api.get<PaginatedResponse<TowingRequest>>(`/requests/user/${userId}`, filters as Record<string, string | number | undefined>);
  if (response.data) {
    return response.data as unknown as PaginatedResponse<TowingRequest>;
  }
  throw new Error(response.error || 'Failed to fetch user requests');
}

export async function getOperatorRequests(operatorId: string, filters?: RequestFilters): Promise<PaginatedResponse<TowingRequest>> {
  const response = await api.get<PaginatedResponse<TowingRequest>>(`/requests/operator/${operatorId}`, filters as Record<string, string | number | undefined>);
  if (response.data) {
    return response.data as unknown as PaginatedResponse<TowingRequest>;
  }
  throw new Error(response.error || 'Failed to fetch operator requests');
}

export async function getPendingRequests(): Promise<TowingRequest[]> {
  const response = await api.get<TowingRequest[]>('/requests/pending');
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to fetch pending requests');
}

export async function acceptRequest(id: string): Promise<TowingRequest> {
  const response = await api.patch<TowingRequest>(`/requests/${id}/accept`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to accept request');
}

export async function startRequest(id: string): Promise<TowingRequest> {
  const response = await api.patch<TowingRequest>(`/requests/${id}/start`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to start request');
}

export async function completeRequest(id: string): Promise<TowingRequest> {
  const response = await api.patch<TowingRequest>(`/requests/${id}/complete`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to complete request');
}

export async function cancelRequest(id: string, reason?: string): Promise<TowingRequest> {
  const response = await api.patch<TowingRequest>(`/requests/${id}/cancel`, { reason });
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to cancel request');
}

export async function trackRequest(id: string): Promise<{
  request: TowingRequest;
  operatorLocation: {
    latitude: number;
    longitude: number;
    heading: number | null;
    timestamp: string;
  } | null;
}> {
  const response = await api.get<{
    request: TowingRequest;
    operatorLocation: {
      latitude: number;
      longitude: number;
      heading: number | null;
      timestamp: string;
    } | null;
  }>(`/requests/${id}/track`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to track request');
}

export async function getPriceEstimate(
  pickupLat: number,
  pickupLng: number,
  destinationLat: number,
  destinationLng: number,
  vehicleType: VehicleType
): Promise<PriceEstimate> {
  const response = await api.get<PriceEstimate>('/pricing/estimate', {
    pickupLat,
    pickupLng,
    destinationLat,
    destinationLng,
    vehicleType,
  });
  if (response.data) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to get price estimate');
}

export async function downloadReceipt(requestId: string): Promise<string> {
  const response = await api.getRaw(`/requests/${requestId}/receipt`);
  return response;
}
