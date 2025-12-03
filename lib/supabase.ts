/**
 * Supabase Client for Expo
 * Uses EXPO_PUBLIC_ environment variables for URL and anon key
 */

import { AuthError, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration from environment variables
// These use EXPO_PUBLIC_ prefix to be accessible on the client side
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Keys used to persist only small token values (avoid storing large session JSON)
const ACCESS_TOKEN_KEY = 'supabase.access_token';
const REFRESH_TOKEN_KEY = 'supabase.refresh_token';

async function saveTokens(accessToken?: string | null, refreshToken?: string | null) {
  try {
    if (accessToken) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    }

    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch (err) {
    console.warn('Failed to persist tokens to SecureStore:', err);
  }
}

async function clearStoredTokens() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to clear tokens from SecureStore:', err);
  }
}

async function getStoredAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

// Create Supabase client with secure storage
let supabaseClient: SupabaseClient | null = null;

function restoreSessionFromStorage(client: SupabaseClient) {
  // Try to restore a small token pair from SecureStore and set session in-memory
  (async () => {
    try {
      const access = await getStoredAccessToken();
      const refresh = await getStoredRefreshToken();
      // Only set session if both tokens are present as strings
      if (access && refresh) {
        // setSession expects access_token and refresh_token as strings
        await client.auth.setSession({
          access_token: access,
          refresh_token: refresh,
        });
      }
    } catch (err) {
      console.warn('Failed to restore supabase session from storage:', err);
      await clearStoredTokens();
    }
  })();
}

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase configuration missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      );
    }

    // Do not persist the full session JSON in SecureStore (can exceed iOS limit).
    // Persist only the minimal tokens via SecureStore helpers above.
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // keep auto refresh enabled for in-memory sessions
        autoRefreshToken: true,
        // we manage persistence ourselves (store tokens only), so disable built-in persistence
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Attempt to restore a previously-stored token pair into the client (async)
    restoreSessionFromStorage(supabaseClient);
  }
  return supabaseClient;
}

// Export the supabase client instance
export const supabase = getSupabase();

// Auth helper types
export interface SignUpResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignInResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with email and password using Supabase Auth
 */
export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign in a user with email and password using Supabase Auth
 */
export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Note: We don't persist Supabase tokens here. After sign-in, the caller should
  // use the session.access_token to call the backend's getSessionWithSupabaseToken,
  // which will store the backend tokens in SecureStore.

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  // Clear our small token storage as well
  try {
    await clearStoredTokens();
  } catch (err) {
    console.warn('Failed to clear stored tokens on sign out:', err);
  }
  return { error };
}

/**
 * Get the current session
 */
export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

/**
 * Get the current access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  // Prefer stored access token (smaller and persisted across restarts)
  const stored = await getStoredAccessToken();
  if (stored) return stored;

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
