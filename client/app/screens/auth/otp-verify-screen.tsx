import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, sendOTP, verifyOTP } from '@/lib/services/authService';
import { isProfileComplete } from '@/lib/services/operatorService';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type UserRole = 'vehicle_owner' | 'tow_operator';

export default function OTPVerifyScreen() {
  const params = useLocalSearchParams<{ phone: string; email?: string; role?: UserRole; type?: 'phone' | 'email' }>();
  const phone = params.phone || '';
  const email = params.email || '';
  const isEmailMode = params.type === 'email' || !!email;
  const role = params.role || 'vehicle_owner';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { showToast } = useToast();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      showToast('Please enter the complete 6-digit code', 'error');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (isEmailMode) {
        const { verifyEmailOTP } = await import('@/lib/services/authService');
        result = await verifyEmailOTP(code);
      } else {
        result = await verifyOTP(phone, code, role);
      }

      if (result.success) {
        showToast('Verification successful!', 'success');

        // For email mode, we might need to log in first or we might already be logged in
        // If it was just a registration flow, we probably want to send them to login or dashboard

        // Check user role and profile completion
        const user = await getCurrentUser();
        if (user) {
          // Get user role from database
          const { data: userData } = await supabase
            .from('users')
            .select('role, profile_completed')
            .eq('id', user.id)
            .single();

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
              router.replace('/operator/(tabs)/dashboard');
            } else {
              router.replace('/screens/operator/profile-setup-screen');
            }
          } else {
            // Regular user - go to tabs
            router.replace('/(tabs)');
          }
        } else {
          // If no user found (e.g. email verification before login), go to login
          if (isEmailMode) {
            router.replace({
              pathname: '/screens/auth/login-screen',
              params: { email, message: 'Email verified. Please log in.' }
            });
          } else {
            router.replace('/(tabs)');
          }
        }
      } else {
        showToast(result.error || 'Invalid OTP code', 'error');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      let result;
      if (isEmailMode) {
        const { resendEmailOTP } = await import('@/lib/services/authService');
        result = await resendEmailOTP(email);
      } else {
        result = await sendOTP(phone);
      }

      if (result.success) {
        showToast('OTP resent successfully!', 'success');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast(result.error || 'Failed to resend OTP', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/screens/auth/login-screen')}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          <ThemedText style={styles.title}>Enter Verification Code</ThemedText>
          <ThemedText style={styles.subtitle}>
            We sent a 6-digit code to {isEmailMode ? email : phone}
          </ThemedText>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  { borderColor, color: textColor },
                  digit && { borderColor: buttonColor },
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: buttonColor },
              otp.join('').length !== 6 && styles.buttonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Verify</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" />
            ) : (
              <ThemedText style={styles.resendText}>Resend Code</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.7,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: Fonts.semiBold,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  resendButton: {
    alignItems: 'center',
    padding: 16,
  },
  resendText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    opacity: 0.7,
  },
});

