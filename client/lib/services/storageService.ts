import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
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
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to array buffer
        const arrayBuffer = decode(base64);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, arrayBuffer, {
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
