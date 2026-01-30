import { supabase } from '@/lib/supabase';

export interface OperatorProfileData {
  ghana_card_number?: string;
  ghana_card_photo_url?: string;
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
      .single();

    if (error) {
      throw error;
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
      'drivers_license_number',
      'drivers_license_photo_url',
      'operator_photo_url',
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
      .single();

    if (error) {
      throw error;
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

