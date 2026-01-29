import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface PhoneAuthResult {
    success: boolean;
    error?: string;
    user?: User;
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phone: string): Promise<PhoneAuthResult> {
    try {
        // Format phone number (ensure it includes country code)
        const formattedPhone = phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`;

        const { data, error } = await supabase.auth.signInWithOtp({
            phone: formattedPhone,
            options: {
                channel: 'sms',
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to send OTP' };
    }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
    phone: string,
    token: string
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

        // Create or update user profile in profiles table
        await createOrUpdateUserProfile(data.user, formattedPhone);

        return { success: true, user: data.user };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to verify OTP' };
    }
}

/**
 * Create or update user profile in profiles table after OTP verification
 */
async function createOrUpdateUserProfile(
    authUser: User,
    phone: string
): Promise<void> {
    try {
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authUser.id)
            .single();

        if (!existingUser) {
            // Create new user profile
            const { error } = await supabase.from('profiles').insert({
                id: authUser.id,
                phone: phone,
                full_name: 'User', // Default name
                role: 'user', // Default role
                // created_at is default
            });

            if (error) {
                console.error('Error creating user profile:', error);
            }
        } else {
            // Profile exists, maybe update something if needed?
            // For now, we trust the existing profile.
        }
    } catch (error) {
        console.error('Error syncing user profile:', error);
        // Non-fatal - continue with auth
    }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
    await supabase.auth.signOut();
}

/**
 * Get current session
 */
export async function getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
