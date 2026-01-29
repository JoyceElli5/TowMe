import { supabase } from '../lib/supabase';

export const authService = {
    async signInWithOtp(phone: string) {
        const { data, error } = await supabase.auth.signInWithOtp({
            phone,
        });
        if (error) throw error;
        return data;
    },

    async verifyOtp(phone: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            phone,
            token,
            type: 'sms',
        });

        if (error) throw error;

        // Check if profile exists, if not create it
        if (data.session?.user) {
            const user = data.session.user;
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profile) {
                // Create new profile
                const { error: createError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: user.id,
                            phone: user.phone,
                            role: 'user', // Default role
                        },
                    ]);
                if (createError) console.error('Error creating profile:', createError);
            }
        }

        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    }
};
