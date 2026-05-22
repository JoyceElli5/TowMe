import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/navigation';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useToast } from '@/hooks/use-toast';
import { ApiError, login as loginApi } from '@/lib/api';
import { signInWithEmail, supabase } from '@/lib/supabase';
import { initPushNotifications } from '@/lib/services/pushNotificationService';
import { LoginFormData, loginSchema, UserRole } from '@/schemas/auth';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role: UserRole }>();
  const role = params.role ?? 'vehicle_owner';
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Login directly with backend API
      const user = await loginApi({
        email: data.email,
        password: data.password,
      });

      console.log('Login successful:', user);

      // Also sign into Supabase Auth so auth.uid() is set for RLS and Storage
      try {
        const { error: supabaseError } = await signInWithEmail(
          data.email,
          data.password
        );
        if (supabaseError) {
          console.warn('Supabase email sign-in failed:', supabaseError.message);
        }
      } catch (supabaseErr: any) {
        console.warn(
          'Error signing into Supabase Auth:',
          supabaseErr?.message || supabaseErr
        );
      }

      showToast('Login successful!', 'success');

      // Register push notification token in the background (non-blocking)
      initPushNotifications().catch((err) =>
        console.warn('[Push] Init failed after login:', err)
      );

      // Navigate to appropriate dashboard based on user role from API response
      setTimeout(async () => {
        if (user.role === 'tow_operator') {
          // Check if operator profile is complete and verified
          const { isProfileComplete, getVerificationStatus } = await import('@/lib/services/operatorService');

          const profileComplete = await isProfileComplete(user.id);
          if (!profileComplete) {
            router.replace('/screens/operator/profile-setup-screen');
            return;
          }

          const verificationStatus = await getVerificationStatus(user.id);
          if (verificationStatus === 'pending' || verificationStatus === 'under_review') {
            router.replace('/screens/operator/verification-pending');
          } else if (verificationStatus === 'rejected') {
            router.replace('/screens/operator/verification-rejected');
          } else if (verificationStatus === 'approved') {
            router.replace('/operator/(tabs)/dashboard');
          } else {
            router.replace('/screens/operator/profile-setup-screen');
          }
        } else {
          router.replace('/(tabs)');
        }
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ApiError) {
        showToast(error.message || 'Invalid email or password', 'error');
      } else if (error instanceof Error) {
        showToast(error.message || 'An unexpected error occurred. Please try again.', 'error');
      } else {
        showToast('An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // const onSubmit= async () => {
  //   router.push('/screens/user/home-screen')
  // }
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = Linking.createURL('/auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });

      if (error || !data.url) {
        showToast('Google sign-in is not available. Please use email login.', 'error');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== 'success') return;

      const fragment = result.url.split('#')[1] || '';
      const urlParams = new URLSearchParams(fragment);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (!accessToken) {
        showToast('Google sign-in failed. Please try again.', 'error');
        return;
      }

      const { data: sessionData } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      const googleUser = sessionData.user;
      if (!googleUser) {
        showToast('Could not retrieve Google account info.', 'error');
        return;
      }

      const { googleLogin } = await import('@/lib/api/auth');
      const user = await googleLogin({
        supabaseToken: accessToken,
        role,
        fullName: String(googleUser.user_metadata?.full_name || googleUser.email || ''),
      });

      showToast('Signed in with Google!', 'success');

      initPushNotifications().catch(() => {});

      if (user.role === 'tow_operator') {
        const { isProfileComplete, getVerificationStatus } = await import('@/lib/services/operatorService');
        const profileComplete = await isProfileComplete(user.id);
        if (!profileComplete) {
          router.replace('/screens/operator/profile-setup-screen');
          return;
        }
        const verificationStatus = await getVerificationStatus(user.id);
        if (verificationStatus === 'pending' || verificationStatus === 'under_review') {
          router.replace('/screens/operator/verification-pending');
        } else if (verificationStatus === 'rejected') {
          router.replace('/screens/operator/verification-rejected');
        } else if (verificationStatus === 'approved') {
          router.replace('/operator/(tabs)/dashboard');
        } else {
          router.replace('/screens/operator/profile-setup-screen');
        }
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    router.push({
      pathname: '/screens/auth/register-screen',
      params: { role },
    });
  };

  const handleBackPress = () => {
    safeBack('/screens/onboarding/role-selection-screen');
  };

  const getRoleTitle = () => {
    return role === 'tow_operator' ? 'Tow Operator' : 'Vehicle Owner';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{getRoleTitle()}</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your journey with TowMe
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    accessibilityLabel="Email input"
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.password && styles.inputError,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      accessibilityLabel="Password input"
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  accessibilityHint={showPassword ? 'Password is currently visible' : 'Password is currently hidden'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/screens/auth/forgot-password-screen')}
              accessibilityLabel="Forgot password"
              accessibilityRole="link"
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              accessibilityLabel="Sign in"
              accessibilityRole="button"
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.loginButtonText, { marginLeft: 12 }]}>Signing in...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialButton}
                accessibilityLabel="Sign in with Google"
                accessibilityRole="button"
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                accessibilityLabel="Sign in with Apple"
                accessibilityRole="button"
              >
                <Ionicons name="logo-apple" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity
              onPress={handleRegisterPress}
              accessibilityLabel="Create an account"
              accessibilityRole="link"
            >
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    marginBottom: 32,
  },
  roleTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  roleTagText: {
    color: '#0369a1',
    fontSize: 13,
    fontFamily: 'Gilroy-Medium',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Gilroy-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#6b7280',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 28,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
    fontFamily: 'Gilroy-Regular',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 18,
    top: 17,
    padding: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontFamily: 'Gilroy-Regular',
    marginTop: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#003554',
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
  },
  loginButton: {
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#6b7280',
    fontSize: 15,
  },
  registerLink: {
    color: '#003554',
    fontSize: 15,
    fontFamily: 'Gilroy-SemiBold',
  },
});
