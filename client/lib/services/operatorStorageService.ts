import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

const BUCKET_NAME = 'operator_documents';

/**
 * Upload operator document to Supabase Storage
 */
export async function uploadOperatorDocument(
  userId: string,
  fileUri: string,
  documentType: 'ghana_card' | 'drivers_license' | 'operator_photo' | 'vehicle_registration' | 'insurance'
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const extension = fileUri.split('.').pop() || 'jpg';
    const filename = `${userId}/${documentType}_${timestamp}.${extension}`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64' as any,
    });

    // Convert base64 to ArrayBuffer for React Native
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload to Supabase Storage using ArrayBuffer
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, byteArray, {
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
    console.error('Error uploading operator document:', error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }
}

/**
 * Delete operator document from Supabase Storage
 */
export async function deleteOperatorDocument(photoUrl: string): Promise<void> {
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
    console.error('Error deleting operator document:', error);
    // Don't throw - document deletion is not critical
  }
}

