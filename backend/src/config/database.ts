import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';

// Use 'any' for database schema since we're using a custom database structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseDatabase = any;

let supabaseClient: SupabaseClient<SupabaseDatabase> | null = null;
let supabaseAdminClient: SupabaseClient<SupabaseDatabase> | null = null;

/**
 * Get Supabase client instance (anon key - respects RLS)
 */
export function getSupabaseClient(): SupabaseClient<SupabaseDatabase> {
  if (!supabaseClient) {
    supabaseClient = createClient<SupabaseDatabase>(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
        },
      }
    );
  }
  return supabaseClient;
}

/**
 * Get Supabase admin client instance (service role key - bypasses RLS)
 * Use with caution - only for server-side operations that need to bypass RLS
 */
export function getSupabaseAdmin(): SupabaseClient<SupabaseDatabase> {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient<SupabaseDatabase>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdminClient;
}

/**
 * Create a new Supabase client with a specific user's JWT token
 * for operations that should respect RLS as that user
 */
export function getSupabaseClientWithToken(token: string): SupabaseClient<SupabaseDatabase> {
  return createClient<SupabaseDatabase>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}
