import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

export type VehicleType = 'car' | 'suv' | 'saloon' | 'van';

export interface UserVehicle {
    id: string;
    user_id: string;
    vehicle_type: VehicleType;
    make: string | null;
    model: string | null;
    color: string | null;
    plate_number: string | null;
    photo_url: string | null;
    created_at: string;
}

export const vehicleService = {
    async getUserVehicles(userId: string) {
        const { data, error } = await supabase
            .from('user_vehicles')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as UserVehicle[];
    },

    async addVehicle(vehicle: Omit<UserVehicle, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('user_vehicles')
            .insert([vehicle])
            .select()
            .single();
        if (error) throw error;
        return data as UserVehicle;
    },

    async updateVehicle(vehicleId: string, updates: Partial<UserVehicle>) {
        const { data, error } = await supabase
            .from('user_vehicles')
            .update(updates)
            .eq('id', vehicleId)
            .select()
            .single();
        if (error) throw error;
        return data as UserVehicle;
    },

    async deleteVehicle(vehicleId: string) {
        const { error } = await supabase
            .from('user_vehicles')
            .delete()
            .eq('id', vehicleId);
        if (error) throw error;
    },

    async uploadVehiclePhoto(userId: string, uri: string) {
        try {
            const ext = uri.substring(uri.lastIndexOf('.') + 1);
            const fileName = `${userId}/${Date.now()}.${ext}`;

            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const { data, error } = await supabase.storage
                .from('vehicle_photos')
                .upload(fileName, decode(base64), {
                    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                    upsert: true,
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('vehicle_photos')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading vehicle photo:', error);
            throw error;
        }
    },
};
