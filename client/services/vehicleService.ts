/**
 * Vehicle Service
 * Handles vehicle CRUD operations and photo uploads
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';

export type VehicleType = 'car' | 'suv' | 'saloon' | 'van';

export interface UserVehicle {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  plate_number?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleData {
  vehicle_type: VehicleType;
  make?: string;
  model?: string;
  color?: string;
  plate_number?: string;
  photo_url?: string;
}

/**
 * Pick an image from device gallery
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerResult> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  return result;
}

/**
 * Upload vehicle photo to Supabase Storage
 * @param userId User ID (for folder organization)
 * @param fileUri Local file URI
 * @returns Public URL of uploaded photo
 */
export async function uploadVehiclePhoto(
  userId: string,
  fileUri: string
): Promise<string> {
  try {
    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = fileUri.split('.').pop() || 'jpg';
    const fileName = `${userId}/${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('vehicle_photos')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('vehicle_photos')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

/**
 * Get all vehicles for current user
 */
export async function getUserVehicles(): Promise<UserVehicle[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get a specific vehicle by ID
 */
export async function getVehicle(vehicleId: string): Promise<UserVehicle> {
  const { data, error } = await supabase
    .from('user_vehicles')
    .select('*')
    .eq('id', vehicleId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
  vehicleData: CreateVehicleData
): Promise<UserVehicle> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .insert({
      ...vehicleData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update a vehicle
 */
export async function updateVehicle(
  vehicleId: string,
  updates: Partial<CreateVehicleData>
): Promise<UserVehicle> {
  const { data, error } = await supabase
    .from('user_vehicles')
    .update(updates)
    .eq('id', vehicleId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
  const { error } = await supabase
    .from('user_vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) {
    throw error;
  }
}
