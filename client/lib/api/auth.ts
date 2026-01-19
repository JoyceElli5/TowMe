/**
 * Authentication API
 */

import api, { ApiError, clearTokens, setAccessToken, setRefreshToken } from './client';

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'vehicle_owner' | 'tow_operator';
  avatarUrl: string | null;
  averageRating: number;
  totalTrips: number;
  isOnline: boolean;
  isVerified: boolean;
}

// PublicUser represents user data returned from public endpoints (without sensitive info like email/phone)
export type PublicUser = Omit<User, 'email' | 'phone'> & {
  createdAt: string;
};

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'vehicle_owner' | 'tow_operator';
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Auth API functions
export async function register(data: RegisterRequest): Promise<User> {
  const response = await api.post<AuthResponse>('/auth/register', data);
  
  if (response.data) {
    await setAccessToken(response.data.accessToken);
    if (response.data.refreshToken) {
      await setRefreshToken(response.data.refreshToken);
    }
    return response.data.user;
  }
  
  throw new ApiError(
    response.error || 'Registration failed',
    500,
    response.errors
  );
}

export async function login(data: LoginRequest): Promise<User> {
  const response = await api.post<AuthResponse>('/auth/login', data);
  
  if (response.data) {
    await setAccessToken(response.data.accessToken);
    if (response.data.refreshToken) {
      await setRefreshToken(response.data.refreshToken);
    }
    return response.data.user;
  }
  
  throw new ApiError(
    response.error || 'Login failed',
    500,
    response.errors
  );
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    await clearTokens();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data?.user || null;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const { getRefreshToken } = await import('./client');
    const refreshToken = await getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }
    
    const response = await api.post<{ accessToken: string }>('/auth/refresh-token', {
      refreshToken,
    });
    
    if (response.data?.accessToken) {
      await setAccessToken(response.data.accessToken);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword });
}
