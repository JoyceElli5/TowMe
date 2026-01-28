/**
 * Phone Login Screen
 * Initiates OTP authentication flow
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { sendOTP } from '@/services/authService';

export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // Format phone number as user types
  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on Ghana phone number pattern
    // Expected: +233241234567 or 0241234567
    let formatted = cleaned;
    
    // If starts with 0, it's a local number
    if (cleaned.startsWith('0') && cleaned.length <= 10) {
      formatted = cleaned;
    } else if (!cleaned.startsWith('233') && cleaned.length > 0) {
      // Add 233 prefix if not present and doesn't start with 0
      formatted = cleaned;
    }
    
    setPhone(formatted);
  };

  const normalizePhoneNumber = (phoneNum: string): string => {
    // Remove all non-numeric characters
    const cleaned = phoneNum.replace(/\D/g, '');
    
    // Convert to international format (+233...)
    if (cleaned.startsWith('0')) {
      return `+233${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('233')) {
      return `+${cleaned}`;
    } else {
      return `+233${cleaned}`;
    }
  };

  const validatePhoneNumber = (phoneNum: string): boolean => {
    const cleaned = phoneNum.replace(/\D/g, '');
    
    // Ghana phone numbers are 10 digits (with leading 0) or 12 digits (with 233)
    if (cleaned.startsWith('0')) {
      return cleaned.length === 10;
    } else if (cleaned.startsWith('233')) {
      return cleaned.length === 12;
    }
    
    return cleaned.length === 9 || cleaned.length === 10;
  };

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(phone)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid Ghana phone number (e.g., 0241234567)'
      );
      return;
    }

    setIsLoading(true);

    try {
      const internationalPhone = normalizePhoneNumber(phone);
      const { error } = await sendOTP(internationalPhone);

      if (error) {
        throw error;
      }

      // Navigate to OTP verification screen
      router.push({
        pathname: '/screens/auth/otp-verify-screen',
        params: { phone: internationalPhone },
      });

      showToast({
        message: 'OTP sent successfully',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Enter Your Phone</Text>
            <Text style={styles.subtitle}>
              We'll send you a verification code via SMS
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.prefixContainer}>
                <Text style={styles.prefixText}>🇬🇭 +233</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="241234567"
                value={phone}
                onChangeText={formatPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
                maxLength={12}
              />
            </View>

            <Text style={styles.hint}>
              Enter your phone number without the country code or leading zero
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  prefixContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  prefixText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  button: {
    height: 56,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
