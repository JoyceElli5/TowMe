import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

const BUCKET_NAME = 'vehicle_photos';

/**
 * Upload vehicle photo to Supabase Storage
 */
export async function uploadVehiclePhoto(
  userId: string,
  fileUri: string
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}.jpg`;

    // Read file as base64
    // In expo-file-system v19+, use 'base64' as string
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64' as any,
    });

    // For React Native, we need to convert base64 to ArrayBuffer
    // Convert base64 string to binary string
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    // Supabase Storage accepts ArrayBuffer or Blob
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, bytes, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
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
      .from(BUCKET_NAME)
      .remove([filename]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting vehicle photo:', error);
    // Don't throw - photo deletion is not critical
  }
}

