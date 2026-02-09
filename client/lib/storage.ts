/**
 * Supabase Storage Utilities
 * Helper functions for uploading files to Supabase Storage
 */

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const BUCKET_NAME = 'operator-documents';

/**
 * Ensure the storage bucket exists
 * This is called before upload attempts
 */
async function ensureBucketExists(): Promise<boolean> {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn('Could not list buckets:', listError.message);
      // Continue anyway - bucket might exist
      return true;
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Bucket "${BUCKET_NAME}" not found. Attempting to create...`);
      // Note: This requires admin/service_role access which we don't have client-side
      // The bucket should be created via Supabase dashboard or backend
      console.warn(`Please create the "${BUCKET_NAME}" bucket in your Supabase dashboard`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Error checking bucket:', error);
    return true; // Continue anyway
  }
}

/**
 * Upload an image to Supabase Storage
 * @param uri - Local file URI from ImagePicker
 * @param folder - Folder path (e.g., 'documents', 'vehicles')
 * @param fileName - Optional custom filename
 * @returns Public URL of the uploaded file
 */
export async function uploadImage(
  uri: string,
  folder: string,
  fileName?: string
): Promise<string> {
  try {
    // Check bucket exists
    await ensureBucketExists();
    
    // Read the file as base64
    let base64: string;
    try {
      base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as FileSystem.EncodingType,
      });
    } catch (readError) {
      console.error('Error reading file:', readError);
      throw new Error('Failed to read the image file. Please try again.');
    }

    // Get file extension
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    // Generate unique filename if not provided
    const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const filePath = `${folder}/${uniqueName}`;

    console.log(`Uploading to ${BUCKET_NAME}/${filePath}...`);

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, decode(base64), {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      
      // Provide specific error messages
      if (error.message.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${BUCKET_NAME}" not found. Please create it in your Supabase dashboard.`);
      } else if (error.message.includes('Policy') || error.message.includes('denied')) {
        throw new Error('Upload permission denied. Please check Supabase storage policies.');
      }
      
      throw new Error(error.message || 'Failed to upload file');
    }

    console.log('Upload successful, getting public URL...');

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
}

/**
 * Upload operator document
 * @param uri - Local file URI
 * @param operatorId - Operator's user ID
 * @param documentType - Type of document
 * @returns Public URL
 */
export async function uploadOperatorDocument(
  uri: string,
  operatorId: string,
  documentType: string
): Promise<string> {
  const folder = `operators/${operatorId}/${documentType}`;
  return uploadImage(uri, folder);
}

/**
 * Upload vehicle photo
 * @param uri - Local file URI
 * @param operatorId - Operator's user ID
 * @param vehicleId - Vehicle ID
 * @param photoType - front, side, or back
 * @returns Public URL
 */
export async function uploadVehiclePhoto(
  uri: string,
  operatorId: string,
  vehicleId: string,
  photoType: 'front' | 'side' | 'back'
): Promise<string> {
  const folder = `operators/${operatorId}/vehicles/${vehicleId}`;
  const fileName = `${photoType}-${Date.now()}.jpg`;
  return uploadImage(uri, folder, fileName);
}

/**
 * Delete a file from storage
 * @param filePath - Full path to the file in the bucket
 */
export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Delete file error:', error);
    throw new Error(error.message || 'Failed to delete file');
  }
}
