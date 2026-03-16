import { supabase } from '@/lib/supabase';

const VEHICLE_PHOTOS_BUCKET = 'vehicle_photos';
const PROFILE_PHOTOS_BUCKET = 'profile_photos';

/**
 * Upload vehicle photo to Supabase Storage
 * Uses fetch + blob approach (compatible with Expo SDK 54+)
 */
export async function uploadVehiclePhoto(
  userId: string,
  fileUri: string
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}.jpg`;

    // Read file as blob using fetch (works with Expo SDK 54+)
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Determine content type from the blob or default to jpeg
    const contentType = blob.type || 'image/jpeg';

    // Upload blob directly to Supabase Storage
    const { error } = await supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .upload(filename, blob, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading vehicle photo:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
}

/**
 * Delete vehicle photo from Supabase Storage
 */
export async function deleteVehiclePhoto(photoUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = photoUrl.split('/');
    const filename = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .remove([filename]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting vehicle photo:', error);
    // Don't throw - photo deletion is not critical
  }
}

/**
 * Upload profile photo to Supabase Storage
 * Uses fetch + blob approach (compatible with Expo SDK 54+)
 */
export async function uploadProfilePhoto(
  userId: string,
  fileUri: string
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}.jpg`;

    // Read file as blob using fetch (works with Expo SDK 54+)
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Determine content type from the blob or default to jpeg
    const contentType = blob.type || 'image/jpeg';

    // Upload blob directly to Supabase Storage
    const { error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .upload(filename, blob, {
        contentType,
        upsert: true, // Allow overwriting existing profile photos
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
}

/**
 * Delete profile photo from Supabase Storage
 */
export async function deleteProfilePhoto(photoUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const urlParts = photoUrl.split('/');
    const filename = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(PROFILE_PHOTOS_BUCKET)
      .remove([filename]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting profile photo:', error);
    // Don't throw - photo deletion is not critical
  }
}

