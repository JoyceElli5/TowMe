import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
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
import { ApiError, checkApiConnection, register as registerApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { RegisterFormData, registerSchema, UserRole } from '@/schemas/auth';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ role: UserRole }>();
  const role = params.role ?? 'vehicle_owner';
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  //   const onSubmit = async (data: RegisterFormData) => {
  //     setIsLoading(true);
  //     try {
  //       // Step 1: Sign up with Supabase Auth
  //       const { user: supabaseUser, session, error: signUpError } = await signUpWithEmail(
  //         data.email,
  //         data.password
  //       );

  //       if (signUpError) {
  //         throw new Error(signUpError.message || 'Failed to create account');
  //       }

  //       // if (!supabaseUser || !session) {
  //       //   throw new Error('Failed to create account. Please try again.');
  //       // }

  //       if (signUpError) throw new Error(signUpError);

  // if (!supabaseUser) {
  //   Alert.alert(
  //     "Check your email",
  //     "Your account was created. Confirm your email to proceed."
  //   );
  //   return;
  // }

  // if (!session) {
  //   // If there's no session (e.g. email confirmation required), inform the user and stop.
  //   Alert.alert(
  //     "Check your email",
  //     "Your account was created. Confirm your email to proceed."
  //   );
  //   return;
  // }

  //       // Step 2: Create profile in backend with the Supabase access token
  //       // This stores the user's role and additional profile data
  //         const user = await createProfile(
  //           {
  //             userId: supabaseUser.id,
  //             email: data.email,
  //             fullName: data.fullName,
  //             phone: data.phone,
  //             role: role,
  //           },
  //           session.access_token
  //         );

  //       console.log('Registration successful:', user);

  //       // Navigate to appropriate dashboard based on user role
  //       if (user.role === 'tow_operator') {
  //         router.replace('/screens/operator/dashboard');
  //       } else {
  //         router.replace('/screens/user/home-screen');
  //       }
  //     } catch (error) {
  //       console.error('Registration error:', error);
  //       if (error instanceof ApiError) {
  //         if (error.errors && error.errors.length > 0) {
  //           const errorMessages = error.errors.map(e => `${e.field}: ${e.message}`).join('\n');
  //           Alert.alert('Registration Failed', errorMessages);
  //         } else {
  //           Alert.alert('Registration Failed', error.message || 'Could not complete registration');
  //         }
  //       } else if (error instanceof Error) {
  //         Alert.alert('Registration Failed', error.message || 'An unexpected error occurred. Please try again.');
  //       } else {
  //         Alert.alert('Registration Failed', 'An unexpected error occurred. Please try again.');
  //       }
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  const onRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Check API connection first
      const isConnected = await checkApiConnection();

      if (!isConnected) {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:3001/api';
        showToast(
          `Cannot connect to backend at ${apiUrl}\n\n` +
          `Please check:\n` +
          `1. Backend is running\n` +
          `2. EXPO_PUBLIC_API_URL is set correctly\n` +
          `3. Network connection is active`,
          'error'
        );
        setIsLoading(false);
        return;
      }

      // Register directly with backend API
      const user = await registerApi({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        role,
      });

      console.log('Registration successful:', user);

      showToast(
        'Account created successfully! Please verify your email with the 6-digit code sent to you.',
        'success'
      );

      // Navigate to OTP verification screen after registration
      setTimeout(() => {
        router.replace({
          pathname: '/screens/auth/otp-verify-screen',
          params: {
            email: data.email,
            role: role,
            type: 'email'
          },
        });
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof ApiError) {
        // Log full error details for debugging
        console.error('API Error Details:', {
          message: error.message,
          status: error.status,
          errors: error.errors,
        });

        if (error.errors && error.errors.length > 0) {
          const errorMessages = error.errors.map(e => `${e.field}: ${e.message}`).join('\n');
          showToast(errorMessages, 'error');
        } else {
          showToast(error.message || 'Registration failed', 'error');
        }
      } else if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
        showToast(error.message || 'An unexpected error occurred. Please try again.', 'error');
      } else {
        showToast('An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = Linking.createURL('/auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });

      if (error || !data.url) {
        showToast('Google sign-in is not configured yet', 'error');
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const fragment = result.url.split('#')[1] || '';
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          const { data: sessionData } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          const googleUser = sessionData.user;
          if (googleUser) {
            // Create backend profile for the Google user
            try {
              const { isProfileComplete } = await import('@/lib/services/operatorService');
              const { getVerificationStatus } = await import('@/lib/services/operatorService');

              // Ensure backend profile exists
              const { createProfile } = await import('@/lib/api/auth');
              await createProfile({
                userId: googleUser.id,
                email: googleUser.email || '',
                fullName: googleUser.user_metadata?.full_name || googleUser.email || '',
                phone: googleUser.phone || '',
                role,
              }, accessToken);
            } catch {
              // Profile may already exist — that's fine
            }

            showToast('Signed in with Google!', 'success');

            if (role === 'tow_operator') {
              router.replace('/screens/operator/profile-setup-screen');
            } else {
              router.replace('/(tabs)');
            }
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.push({
      pathname: '/screens/auth/login-screen',
      params: { role },
    });
  };

  const handleBackPress = () => {
    router.back();
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join TowMe and start your journey today
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.fullName && styles.inputError]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    autoComplete="name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    accessibilityLabel="Full name input"
                  />
                )}
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName.message}</Text>
              )}
            </View>

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

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError]}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    accessibilityLabel="Phone number input"
                  />
                )}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
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
                      placeholder="Create a password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
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

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        errors.confirmPassword && styles.inputError,
                      ]}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      accessibilityLabel="Confirm password input"
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  accessibilityHint={showConfirmPassword ? 'Password is currently visible' : 'Password is currently hidden'}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>

            {/* Terms & Conditions */}
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onRegister)}
              disabled={isLoading}
              accessibilityLabel="Create account"
              accessibilityRole="button"
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.registerButtonText, { marginLeft: 12 }]}>Creating account...</Text>
                </View>
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
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
                accessibilityLabel="Sign up with Google"
                accessibilityRole="button"
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#4285F4" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                accessibilityLabel="Sign up with Apple"
                accessibilityRole="button"
              >
                <Ionicons name="logo-apple" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={handleLoginPress}
              accessibilityLabel="Sign in"
              accessibilityRole="link"
            >
              <Text style={styles.loginLink}>Sign In</Text>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 20,
    color: '#111827',
  },
  header: {
    marginBottom: 24,
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
    fontWeight: '700',
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
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
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
  termsText: {
    fontSize: 13,
    fontFamily: 'Gilroy-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  termsLink: {
    color: '#003554',
    fontFamily: 'Gilroy-SemiBold',
  },
  registerButton: {
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
  registerButtonText: {
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
    marginVertical: 20,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6b7280',
    fontSize: 15,
    fontFamily: 'Gilroy-Regular',
  },
  loginLink: {
    color: '#003554',
    fontSize: 15,
    fontFamily: 'Gilroy-SemiBold',
  },
});
