import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const realtimeService = {
    subscribeToRequestUpdates(requestId: string, onUpdate: (payload: any) => void): RealtimeChannel {
        return supabase
            .channel(`request_${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tow_requests',
                    filter: `id=eq.${requestId}`,
                },
                (payload) => {
                    onUpdate(payload.new);
                }
            )
            .subscribe();
    },

    subscribeToDriverLocation(driverId: string, onUpdate: (payload: any) => void): RealtimeChannel {
        return supabase
            .channel(`driver_loc_${driverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'driver_status',
                    filter: `driver_id=eq.${driverId}`
                },
                (payload) => onUpdate(payload.new)
            )
            .subscribe();
    }
};
