import { ThemedView } from '@/components/themed-view';
import { getCurrentUser as getApiUser } from '@/lib/api/auth';
import { getAccessToken, getRefreshToken, setAccessToken } from '@/lib/api/client';
import { getCurrentSession } from '@/lib/services/authService';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:3001/api';

/** Try to refresh the JWT access token using the stored refresh token */
async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    const token = data?.data?.accessToken ?? data?.accessToken;
    if (token) {
      await setAccessToken(token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Navigate based on the user's role and profile state */
async function navigateByRole(
  userId: string,
  role: string,
  profileCompleted?: boolean
): Promise<void> {
  if (role === 'tow_operator') {
    router.replace('/operator/(tabs)/dashboard');
  } else {
    router.replace('/(tabs)');
  }
}

export default function IndexScreen() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ── Step 1: Try Supabase session (phone OTP users) ──────────────────
        const session = await getCurrentSession();

        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role, profile_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          if (userData) {
            await navigateByRole(session.user.id, userData.role, userData.profile_completed);
            return;
          }
          // User in Supabase auth but no profile yet – onboard them
          router.replace('/screens/onboarding/onboarding-screen');
          return;
        }

        // ── Step 2: Try JWT token (email/password users) ─────────────────────
        let accessToken = await getAccessToken();

        if (accessToken) {
          try {
            const user = await getApiUser();
            if (user) {
              await navigateByRole(user.id, user.role);
              return;
            }
          } catch (err: any) {
            // 401 means the token is expired – try refreshing
            if (err?.status === 401) {
              const refreshed = await tryRefreshToken();
              if (refreshed) {
                const user = await getApiUser();
                if (user) {
                  await navigateByRole(user.id, user.role);
                  return;
                }
              }
            }
            // Token invalid/expired and refresh failed – fall through to onboarding
          }
        }

        // ── Step 3: No valid auth – go to onboarding ─────────────────────────
        router.replace('/screens/onboarding/onboarding-screen');
      } catch (error) {
        console.error('Auth check error:', error);
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
