/**
 * API Client Configuration
 * Axios-based HTTP client for TowMe backend API
 */

import * as SecureStore from "expo-secure-store";

// API Configuration
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://172.20.10.2:3001/api";

// Debug: Log API URL (remove in production)
if (__DEV__) {
  console.log("🔗 API Base URL:", API_BASE_URL);
  console.log(
    "🔗 Environment variable:",
    process.env.EXPO_PUBLIC_API_URL || "NOT SET (using fallback)",
  );
}

// Helper function to check API connectivity
export async function checkApiConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Try health endpoint first, fallback to root
    let healthUrl = API_BASE_URL.endsWith("/api")
      ? `${API_BASE_URL}/health`
      : `${API_BASE_URL}/health`;

    // If health endpoint doesn't exist, try the base API URL
    let response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => null);

    // If health check failed, try base URL
    if (!response || !response.ok) {
      const baseUrl = API_BASE_URL.endsWith("/api")
        ? API_BASE_URL.replace("/api", "")
        : API_BASE_URL;
      response = await fetch(baseUrl, {
        method: "GET",
        signal: controller.signal,
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    if (__DEV__) {
      console.log("🔍 API Connection Check:", {
        url: healthUrl,
        connected: response?.ok ?? false,
        status: response?.status,
      });
    }

    return response?.ok ?? false;
  } catch (error) {
    if (__DEV__) {
      console.error("❌ API Connection Check Failed:", error);
    }
    return false;
  }
}

// Token storage keys
const ACCESS_TOKEN_KEY = "towme_access_token";
const REFRESH_TOKEN_KEY = "towme_refresh_token";

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class ApiError extends Error {
  status: number;
  errors?: { field: string; message: string }[];

  constructor(
    message: string,
    status: number,
    errors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

// Token management
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to save access token:", error);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to save refresh token:", error);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to clear tokens:", error);
  }
}

// API client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Try to refresh access token using refresh token; returns true if new token was stored. */
  private async tryRefreshAndStoreToken(): Promise<boolean> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    try {
      const url = `${this.baseUrl}/auth/refresh-token`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const token = data?.data?.accessToken ?? data?.accessToken;
      if (token) {
        await setAccessToken(token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<ApiResponse<T>> {
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 1000; // 1 second

    const url = `${this.baseUrl}${endpoint}`;

    // Debug logging
    if (__DEV__) {
      console.log(`🌐 API Request [Attempt ${retryCount + 1}]:`, {
        method: options.method || "GET",
        url,
      });
    }

    // Get access token
    const token = await getAccessToken();

    // Default headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // Add authorization header if token exists
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // 401: try refresh token once, then retry (skip for auth endpoints to avoid loops)
        const isAuthEndpoint = endpoint.includes("/auth/");
        if (response.status === 401 && retryCount === 0 && !isAuthEndpoint) {
          const refreshed = await this.tryRefreshAndStoreToken();
          if (refreshed) {
            return this.request<T>(endpoint, options, retryCount + 1);
          }
          await clearTokens();
          throw new ApiError("Session expired. Please sign in again.", 401);
        }

        // Retry logic for idempotent methods (GET) or specific status codes
        const isIdempotent =
          !options.method ||
          options.method === "GET" ||
          options.method === "HEAD" ||
          options.method === "OPTIONS";
        const isRetryableStatus = [408, 429, 500, 502, 503, 504].includes(
          response.status,
        );

        if (isIdempotent && isRetryableStatus && retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          if (__DEV__) console.log(`⏳ Retrying request in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        let errorMessage = `Request failed with status ${response.status}`;
        let errors;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errors = errorData.errors;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        throw new ApiError(errorMessage, response.status, errors);
      }

      // Parse JSON response
      let data: ApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        throw new ApiError(
          "Invalid JSON response from server",
          response.status,
        );
      }

      return data;
    } catch (error) {
      // Handle network errors with retry
      const isNetworkError =
        error instanceof TypeError && error.message.includes("fetch");
      const isTimeoutError =
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError");
      const isRegisterEndpoint = endpoint.startsWith("/auth/register");

      // For registration, avoid automatic network retries to prevent
      // confusing "email already registered" if the first attempt succeeded
      // on the server but the client experienced a transient network error.
      if (!isRegisterEndpoint && (isNetworkError || isTimeoutError) && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        if (__DEV__) console.log(`📡 Network error, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      if (isNetworkError) {
        throw new ApiError(
          `Unable to connect to server. Please check your internet connection.`,
          0,
        );
      }

      if (isTimeoutError) {
        throw new ApiError("Request timed out. Please try again.", 0);
      }

      throw new ApiError(
        error instanceof Error ? error.message : "Network error occurred",
        0,
      );
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async getRaw(endpoint: string): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get access token
    const token = await getAccessToken();

    // Default headers
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          // Try to parse as JSON first for structured errors
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // For non-JSON responses, use a generic message
            errorMessage = response.statusText || errorMessage;
          }
        } catch {
          // If parsing fails, use generic message
          errorMessage = `Failed to download content: ${response.statusText || "Unknown error"}`;
        }
        throw new ApiError(errorMessage, response.status);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Network error occurred",
        0,
      );
    }
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
export default api;
