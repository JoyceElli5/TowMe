import { ThemedView } from '@/components/themed-view';
import { getCurrentSession, getCurrentUser } from '@/lib/services/authService';
import { isProfileComplete } from '@/lib/services/operatorService';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

export default function IndexScreen() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getCurrentSession();
        console.log('Auth check - Session:', session ? 'exists' : 'none');
        
        if (session && session.user) {
          // Check user role and profile completion
          const user = await getCurrentUser();
          console.log('Auth check - User:', user ? user.id : 'none');
          
          if (user) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role, profile_completed')
                .eq('id', user.id)
                .single();

              if (userError) {
                console.error('Error fetching user data:', userError);
                // If user doesn't exist in users table, redirect to onboarding
                router.replace('/screens/onboarding/onboarding-screen');
                return;
              }

              if (userData?.role === 'tow_operator') {
                // Check if operator profile is complete
                const profileComplete = await isProfileComplete(user.id);
                if (!profileComplete) {
                  router.replace('/screens/operator/profile-setup-screen');
                  return;
                }
                
                // Check verification status
                const { data: operatorData } = await supabase
                  .from('users')
                  .select('verification_status')
                  .eq('id', user.id)
                  .single();
                
                const verificationStatus = operatorData?.verification_status;
                
                if (verificationStatus === 'pending' || verificationStatus === 'under_review') {
                  router.replace('/screens/operator/verification-pending');
                } else if (verificationStatus === 'rejected') {
                  router.replace('/screens/operator/verification-rejected');
                } else if (verificationStatus === 'approved') {
                  router.replace('/screens/operator/dashboard');
                } else {
                  // Default to profile setup if status is unclear
                  router.replace('/screens/operator/profile-setup-screen');
                }
              } else {
                // Regular user - go to tabs
                router.replace('/(tabs)');
              }
            } catch (dbError) {
              console.error('Database error:', dbError);
              // On error, redirect to onboarding
              router.replace('/screens/onboarding/onboarding-screen');
            }
          } else {
            // No user found - redirect to onboarding
            router.replace('/screens/onboarding/onboarding-screen');
          }
        } else {
          // No session - redirect to onboarding
          console.log('No session found, redirecting to onboarding');
          router.replace('/screens/onboarding/onboarding-screen');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On any error, redirect to onboarding
        router.replace('/screens/onboarding/onboarding-screen');
      }
    };
    checkAuth();
  }, []);

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}
