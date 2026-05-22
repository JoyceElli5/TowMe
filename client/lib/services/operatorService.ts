import { supabase } from '@/lib/supabase';

export interface OperatorProfileData {
  ghana_card_number?: string;
  ghana_card_photo_url?: string;
  selfie_with_id_photo_url?: string;
  drivers_license_number?: string;
  drivers_license_photo_url?: string;
  operator_photo_url?: string;
  vehicle_registration_number?: string;
  vehicle_registration_photo_url?: string;
  insurance_policy_number?: string;
  insurance_photo_url?: string;
}

export interface OperatorProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: 'tow_operator';
  profile_completed: boolean;
  verification_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  ghana_card_number: string | null;
  ghana_card_photo_url: string | null;
  drivers_license_number: string | null;
  drivers_license_photo_url: string | null;
  operator_photo_url: string | null;
  vehicle_registration_number: string | null;
  vehicle_registration_photo_url: string | null;
  insurance_policy_number: string | null;
  insurance_photo_url: string | null;
}

/**
 * Get operator profile
 */
export async function getOperatorProfile(userId: string): Promise<OperatorProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('role', 'tow_operator')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      // No operator profile row found for this user
      return null;
    }

    return data as OperatorProfile;
  } catch (error: any) {
    console.error('Error fetching operator profile:', error);
    return null;
  }
}

/**
 * Update operator profile
 */
export async function updateOperatorProfile(
  userId: string,
  data: OperatorProfileData
): Promise<OperatorProfile> {
  try {
    // Check if all required fields are provided
    const requiredFields = [
      'ghana_card_number',
      'ghana_card_photo_url',
      'selfie_with_id_photo_url',
      'drivers_license_number',
      'drivers_license_photo_url',
      'operator_photo_url',
      'vehicle_registration_number',
      'vehicle_registration_photo_url',
      'insurance_policy_number',
      'insurance_photo_url',
    ];

    const hasAllRequired = requiredFields.every(
      (field) => data[field as keyof OperatorProfileData]
    );

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        ...data,
        profile_completed: hasAllRequired,
        verification_status: hasAllRequired ? 'under_review' : 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!updatedProfile) {
      // If update failed, check if we need to create the profile
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.id === userId) {
        console.log('Profile not found, creating new operator profile...');

        // Ensure we have a phone number (required by DB schema usually)
        const phone = user.phone || '';

        // Create the profile
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: user.email || null,
            phone: phone,
            full_name: user.user_metadata?.full_name || phone || 'Tow Operator', // Fallback name
            role: 'tow_operator',
            ...data,
            profile_completed: hasAllRequired,
            verification_status: hasAllRequired ? 'under_review' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(), // updated_at is usually present
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating operator profile:', insertError);
          // If insert fails, throw the original error or a new one
          throw new Error('Profile not found and failed to create: ' + insertError.message);
        }

        return newProfile as OperatorProfile;
      }

      throw new Error('Profile not found or you do not have permission to update it.');
    }

    return updatedProfile as OperatorProfile;
  } catch (error: any) {
    console.error('Error updating operator profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Check if operator profile is complete
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  try {
    const profile = await getOperatorProfile(userId);
    return profile?.profile_completed || false;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
}

/**
 * Check if operator is verified (approved)
 */
export async function isOperatorVerified(userId: string): Promise<boolean> {
  try {
    const profile = await getOperatorProfile(userId);
    return profile?.verification_status === 'approved';
  } catch (error) {
    console.error('Error checking operator verification:', error);
    return false;
  }
}

/**
 * Get operator verification status
 */
export async function getVerificationStatus(userId: string): Promise<'pending' | 'under_review' | 'approved' | 'rejected' | null> {
  try {
    const profile = await getOperatorProfile(userId);
    return profile?.verification_status || null;
  } catch (error) {
    console.error('Error getting verification status:', error);
    return null;
  }
}

