/**
 * Authentication Service
 * Handles phone OTP authentication with Supabase
 */

import { supabase } from '@/lib/supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';

export interface SignInWithOTPResult {
  error: AuthError | null;
}

export interface VerifyOTPResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Send OTP code to phone number
 * @param phone Phone number in international format (e.g., +233241234567)
 */
export async function sendOTP(phone: string): Promise<SignInWithOTPResult> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
  });

  return { error };
}

/**
 * Verify OTP code
 * @param phone Phone number in international format
 * @param token 6-digit OTP code
 */
export async function verifyOTP(
  phone: string,
  token: string
): Promise<VerifyOTPResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (!error && data.user) {
    // Check if profile exists, create if not
    await ensureProfile(data.user.id, phone);
  }

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Ensure user profile exists after authentication
 * Creates profile if it doesn't exist
 */
async function ensureProfile(userId: string, phone: string): Promise<void> {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      // Create profile with default values
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        phone,
        role: 'user',
      });

      if (error) {
        console.error('Failed to create profile:', error);
      }
    }
  } catch (error) {
    console.error('Error ensuring profile:', error);
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current session
 */
export async function getSession(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

/**
 * Get current user profile
 */
export async function getCurrentProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  return { data, error };
}

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  full_name?: string;
  phone?: string;
}) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    return { error: new Error('No authenticated user') };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}
