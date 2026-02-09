import { supabase } from '@/lib/supabase';
import { API_BASE_URL, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api/client';
import type { User } from '@supabase/supabase-js';

export interface PhoneAuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Bridge Supabase auth session to backend JWT tokens.
 * After phone OTP login (Supabase), this calls the backend /auth/session
 * endpoint which validates the Supabase token and returns backend JWT
 * tokens for all subsequent API calls.
 *
 * This is the glue between the two auth systems:
 *   Supabase (phone OTP) → Backend (JWT for API authorization)
 */
export async function bridgeAuthSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.log('⚠️ No Supabase session to bridge');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Bridge auth failed:', response.status);
      return false;
    }

    const result = await response.json();

    if (result.success && result.data) {
      await setAccessToken(result.data.accessToken);
      if (result.data.refreshToken) {
        await setRefreshToken(result.data.refreshToken);
      }
      console.log('✅ Auth bridged: Supabase → Backend JWT');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error bridging auth session:', error);
    return false;
  }
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<PhoneAuthResult> {
  try {
    // Format phone number (ensure it includes country code)
    // Remove any spaces or dashes
    const cleanedPhone = phone.replace(/\s|-/g, '');
    let formattedPhone: string;
    
    if (cleanedPhone.startsWith('+233')) {
      formattedPhone = cleanedPhone;
    } else if (cleanedPhone.startsWith('233')) {
      formattedPhone = `+${cleanedPhone}`;
    } else if (cleanedPhone.startsWith('0')) {
      formattedPhone = `+233${cleanedPhone.substring(1)}`;
    } else {
      // Assume it's a 9-digit number without prefix
      formattedPhone = `+233${cleanedPhone}`;
    }
    
    console.log('Sending OTP to:', formattedPhone);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('unsupported') || error.message.includes('provider')) {
        return { 
          success: false, 
          error: 'SMS provider not configured. Please configure Twilio or another SMS provider in your Supabase dashboard under Authentication > Phone Auth settings.' 
        };
      }
      
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('OTP send error:', error);
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  phone: string,
  token: string,
  role: 'vehicle_owner' | 'tow_operator' = 'vehicle_owner'
): Promise<PhoneAuthResult> {
  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`;
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'No user returned from verification' };
    }

    // Create or update user profile in users table
    await createOrUpdateUserProfile(data.user, formattedPhone, role);

    // Bridge to backend JWT so all API calls work immediately
    await bridgeAuthSession();

    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
}

/**
 * Create or update user profile in users table after OTP verification
 */
async function createOrUpdateUserProfile(
  authUser: User,
  phone: string,
  role: 'vehicle_owner' | 'tow_operator' = 'vehicle_owner'
): Promise<void> {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', authUser.id)
      .single();

    if (!existingUser) {
      // Create new user profile
      const { error } = await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email || null,
        phone: phone,
        full_name: phone, // Default to phone, user can update later
        role: role,
        is_verified: true,
        profile_completed: role === 'vehicle_owner', // Operators need to complete profile
        verification_status: role === 'vehicle_owner' ? 'approved' : 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error creating user profile:', error);
        // Don't throw - auth succeeded, profile can be created later
      }
    } else {
      // Update existing user (mark as verified)
      await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', authUser.id);
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
    // Non-fatal - continue with auth
  }
}

/**
 * Sign out current user — clears both Supabase and backend JWT tokens
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  // Also clear backend JWT tokens so API calls stop working
  await clearTokens();
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    // Check if session is valid (not expired)
    if (session && session.expires_at) {
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      if (Date.now() >= expiresAt) {
        console.log('Session expired, clearing...');
        await supabase.auth.signOut();
        return null;
      }
    }
    return session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return null;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

