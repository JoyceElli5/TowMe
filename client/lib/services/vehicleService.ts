import type { VehicleType } from '@/constants/pricing';
import { supabase } from '@/lib/supabase';

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
    updated_at?: string;
}

export interface CreateVehicleData {
    vehicle_type: VehicleType;
    make?: string;
    model?: string;
    color?: string;
    plate_number?: string;
    photo_url?: string;
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> { }

/**
 * Get all vehicles for current user
 */
export async function getUserVehicles(userId: string): Promise<UserVehicle[]> {
    try {
        const { data, error } = await supabase
            .from('user_vehicles')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return (data || []) as UserVehicle[];
    } catch (error: any) {
        console.error('Error fetching user vehicles:', error);
        throw new Error(`Failed to fetch vehicles: ${error.message}`);
    }
}

/**
 * Create a new vehicle
 */
export async function createVehicle(
    userId: string,
    data: CreateVehicleData
): Promise<UserVehicle> {
    try {
        const { data: vehicle, error } = await supabase
            .from('user_vehicles')
            .insert({
                user_id: userId,
                ...data,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return vehicle as UserVehicle;
    } catch (error: any) {
        console.error('Error creating vehicle:', error);
        throw new Error(`Failed to create vehicle: ${error.message}`);
    }
}

/**
 * Update a vehicle
 */
export async function updateVehicle(
    vehicleId: string,
    data: UpdateVehicleData
): Promise<UserVehicle> {
    try {
        const { data: vehicle, error } = await supabase
            .from('user_vehicles')
            .update(data)
            .eq('id', vehicleId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return vehicle as UserVehicle;
    } catch (error: any) {
        console.error('Error updating vehicle:', error);
        throw new Error(`Failed to update vehicle: ${error.message}`);
    }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(vehicleId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('user_vehicles')
            .delete()
            .eq('id', vehicleId);

        if (error) {
            throw error;
        }
    } catch (error: any) {
        console.error('Error deleting vehicle:', error);
        throw new Error(`Failed to delete vehicle: ${error.message}`);
    }
}
