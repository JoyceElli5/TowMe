/**
 * Authentication API
 */

import api, { setAccessToken, setRefreshToken, clearTokens, ApiResponse, ApiError, API_BASE_URL } from './client';

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

// Create profile request for Supabase auth flow
export interface CreateProfileRequest {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'vehicle_owner' | 'tow_operator';
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
  
  throw new Error(response.error || 'Registration failed');
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
  
  throw new Error(response.error || 'Login failed');
}

/**
 * Create a user profile after Supabase authentication
 * This should be called after successful Supabase signup with the Supabase access token
 * @param data Profile data including userId from Supabase
 * @param supabaseAccessToken The access token from Supabase session
 */
export async function createProfile(
  data: CreateProfileRequest,
  supabaseAccessToken: string
): Promise<User> {
  // Make request with Supabase access token for authentication
  // Using direct fetch here because we need to pass the Supabase token, not the stored backend token
  const response = await fetch(`${API_BASE_URL}/auth/create-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAccessToken}`,
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      result.error || 'Failed to create profile',
      response.status,
      result.errors
    );
  }
  
  if (result.data) {
    // Store the backend tokens for subsequent API calls
    await setAccessToken(result.data.accessToken);
    if (result.data.refreshToken) {
      await setRefreshToken(result.data.refreshToken);
    }
    return result.data.user;
  }
  
  throw new Error('Failed to create profile');
}

/**
 * Get session data using Supabase token
 * This should be called after Supabase login to get user profile and backend tokens
 * @param supabaseAccessToken The access token from Supabase session
 */
export async function getSessionWithSupabaseToken(
  supabaseAccessToken: string
): Promise<User> {
  // Using direct fetch here because we need to pass the Supabase token, not the stored backend token
  const response = await fetch(`${API_BASE_URL}/auth/session`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAccessToken}`,
    },
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      result.error || 'Failed to get session',
      response.status,
      result.errors
    );
  }
  
  if (result.data) {
    // Store the backend tokens for subsequent API calls
    await setAccessToken(result.data.accessToken);
    if (result.data.refreshToken) {
      await setRefreshToken(result.data.refreshToken);
    }
    return result.data.user;
  }
  
  throw new Error('Failed to get session');
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
