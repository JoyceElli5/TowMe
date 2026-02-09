import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'operator_documents';

/**
 * Upload operator document to Supabase Storage
 * Uses fetch + blob approach (compatible with Expo SDK 54+)
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

    // Read file as blob using fetch (works with Expo SDK 54+)
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Determine content type from the blob or default to jpeg
    const contentType = blob.type || 'image/jpeg';

    // Upload blob directly to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, blob, {
        contentType,
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

