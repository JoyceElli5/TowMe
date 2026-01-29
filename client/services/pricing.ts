import { supabase } from '../lib/supabase';
import { VehicleType } from './vehicles';

export interface VehiclePricing {
    vehicle_type: VehicleType;
    base_fee: number;
    per_km_fee: number;
    min_fee: number;
}

export const pricingService = {
    async getPricing() {
        const { data, error } = await supabase
            .from('vehicle_pricing')
            .select('*');
        if (error) throw error;

        // Transform array to object for easier helper access
        const pricingMap: Record<string, VehiclePricing> = {};
        data.forEach((p: VehiclePricing) => {
            pricingMap[p.vehicle_type] = p;
        });

        return pricingMap;
    },

    estimatePrice(
        pricing: VehiclePricing,
        distanceKm: number
    ) {
        const rawPrice = pricing.base_fee + (pricing.per_km_fee * distanceKm);
        return Math.max(pricing.min_fee, rawPrice);
    },
};
