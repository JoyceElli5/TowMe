/**
 * Email Verification Screen
 * Allows users to verify their email address with a token
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useToast } from '@/hooks/use-toast';
import { ApiError, verifyEmail } from '@/lib/api';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token || '';
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const { showToast } = useToast();

  const handleVerification = useCallback(async () => {
    if (!token) {
      setVerificationStatus('error');
      showToast('Invalid verification link', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmail(token);
      setVerificationStatus('success');
      showToast('Email verified successfully!', 'success');
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      if (error instanceof ApiError) {
        showToast(error.message || 'Failed to verify email', 'error');
      } else if (error instanceof Error) {
        showToast(error.message || 'An unexpected error occurred', 'error');
      } else {
        showToast('An unexpected error occurred', 'error');
      }
    } finally {
      setIsVerifying(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token, handleVerification]);

  const handleBackPress = () => {
    safeBack('/screens/auth/login-screen');
  };

  const handleLogin = () => {
    router.replace('/screens/auth/login-screen');
  };

  const renderContent = () => {
    if (isVerifying) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <Text style={styles.statusTitle}>Verifying Your Email</Text>
          <Text style={styles.statusMessage}>
            Please wait while we verify your email address...
          </Text>
        </View>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
          </View>
          <Text style={styles.statusTitle}>Email Verified!</Text>
          <Text style={styles.statusMessage}>
            Your email has been successfully verified. You can now access all features of TowMe.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogin}
          >
            <Text style={styles.actionButtonText}>Continue to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="close-circle" size={64} color="#ef4444" />
          </View>
          <Text style={styles.statusTitle}>Verification Failed</Text>
          <Text style={styles.statusMessage}>
            The verification link is invalid or has expired. Please request a new verification email.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLogin}
          >
            <Text style={styles.actionButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 28,
    fontFamily: 'Gilroy-SemiBold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
  },
});
