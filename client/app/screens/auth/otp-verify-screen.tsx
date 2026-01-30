import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/hooks/use-toast';
import { verifyOTP, sendOTP } from '@/lib/services/authService';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { isProfileComplete } from '@/lib/services/operatorService';
import { getCurrentUser } from '@/lib/services/authService';
import { supabase } from '@/lib/supabase';

type UserRole = 'vehicle_owner' | 'tow_operator';

export default function OTPVerifyScreen() {
  const params = useLocalSearchParams<{ phone: string; role?: UserRole }>();
  const phone = params.phone || '';
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
      const result = await verifyOTP(phone, code, role);
      if (result.success) {
        showToast('Login successful!', 'success');
        
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
            } else {
              router.replace('/screens/operator/dashboard');
            }
          } else {
            // Regular user - go to tabs
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/(tabs)');
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
      const result = await sendOTP(phone);
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
          <ThemedText style={styles.title}>Enter Verification Code</ThemedText>
          <ThemedText style={styles.subtitle}>
            We sent a 6-digit code to {phone}
          </ThemedText>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
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
    justifyContent: 'center',
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

