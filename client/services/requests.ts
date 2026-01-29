import { supabase } from '../lib/supabase';
import { VehicleType } from './vehicles';

export type RequestStatus = 'pending' | 'matched' | 'driver_enroute' | 'towing' | 'completed' | 'cancelled';

export interface TowRequest {
    id: string;
    user_id: string;
    pickup_lat: number;
    pickup_lng: number;
    pickup_address: string;
    dest_lat: number;
    dest_lng: number;
    dest_address: string;
    vehicle_type: VehicleType;
    estimated_distance_km: number;
    estimated_cost: number;
    status: RequestStatus;
    created_at: string;
}

export const requestService = {
    async createRequest(request: Omit<TowRequest, 'id' | 'user_id' | 'status' | 'created_at'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tow_requests')
            .insert([{
                ...request,
                user_id: user.id
            }])
            .select()
            .single();
        if (error) throw error;
        return data as TowRequest;
    },

    async getRequest(requestId: string) {
        const { data, error } = await supabase
            .from('tow_requests')
            .select('*')
            .eq('id', requestId)
            .single();
        if (error) throw error;
        return data as TowRequest;
    },

    async matchDriver(requestId: string) {
        const { data, error } = await supabase
            .rpc('match_driver', { request_id: requestId });
        if (error) throw error;
        return data;
    },

    async cancelRequest(requestId: string) {
        const { error } = await supabase
            .from('tow_requests')
            .update({ status: 'cancelled' })
            .eq('id', requestId);

        if (error) throw error;
    },

    async getHistory() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('tow_requests')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['completed', 'cancelled'])
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as TowRequest[];
    },

    async getActiveRequest() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('tow_requests')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['pending', 'matched', 'driver_enroute', 'towing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
        return data as TowRequest | null;
    }
};
