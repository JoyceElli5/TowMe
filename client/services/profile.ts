import { supabase } from '../lib/supabase';

export interface Profile {
    id: string;
    full_name: string | null;
    phone: string | null;
    role: 'user' | 'driver' | 'admin';
    created_at: string;
    avatar_url: string | null;
}

export const profileService = {
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data as Profile;
    },

    async updateProfile(userId: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        if (error) throw error;
        return data as Profile;
    },
};
