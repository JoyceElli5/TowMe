/**
 * Verification Pending Screen
 * 
 * Shown when operator's verification is pending or under review
 */

import { router } from 'expo-router';
import { AlertCircleIcon, LegalDocument01Icon } from 'hugeicons-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCurrentUser } from '@/lib/api';
import { getVerificationStatus } from '@/lib/services/operatorService';

export default function VerificationPendingScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'under_review' | 'approved' | 'rejected' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkVerificationStatus();
    // Check every 30 seconds for status updates
    const interval = setInterval(checkVerificationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/screens/auth/login-screen');
        return;
      }

      const status = await getVerificationStatus(user.id);
      setVerificationStatus(status);

      if (status === 'approved') {
        router.replace('/operator/(tabs)/dashboard');
      } else if (status === 'rejected') {
        router.replace('/screens/operator/verification-rejected');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/screens/operator/profile-setup-screen');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${tintColor}15` }]}>
          <LegalDocument01Icon size={64} color={tintColor} strokeWidth={1.5} />
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>
          {verificationStatus === 'under_review' ? 'Verification Under Review' : 'Verification Pending'}
        </ThemedText>

        {/* Description */}
        <ThemedText style={styles.description}>
          {verificationStatus === 'under_review'
            ? 'Your documents are being reviewed by our team. This usually takes 24-48 hours. You will be notified once your verification is complete.'
            : 'Please complete your profile setup and submit your documents for verification. Once submitted, our team will review your application.'}
        </ThemedText>

        {/* Status Card */}
        <ThemedView style={[styles.statusCard, { borderColor }]}>
          <View style={styles.statusHeader}>
            <AlertCircleIcon size={24} color={tintColor} strokeWidth={2} />
            <ThemedText style={styles.statusTitle}>Current Status</ThemedText>
          </View>
          <ThemedText style={[styles.statusValue, { color: tintColor }]}>
            {verificationStatus === 'under_review' ? 'Under Review' : 'Pending Submission'}
          </ThemedText>
        </ThemedView>

        {/* Info Section */}
        <ThemedView style={[styles.infoCard, { borderColor }]}>
          <ThemedText style={styles.infoTitle}>What happens next?</ThemedText>
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoBullet}>•</ThemedText>
            <ThemedText style={styles.infoText}>
              {verificationStatus === 'under_review'
                ? 'Our team is reviewing your submitted documents'
                : 'Complete your profile and upload required documents'}
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoBullet}>•</ThemedText>
            <ThemedText style={styles.infoText}>
              {verificationStatus === 'under_review'
                ? 'You will receive a notification when verification is complete'
                : 'Submit your profile for review'}
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText style={styles.infoBullet}>•</ThemedText>
            <ThemedText style={styles.infoText}>
              {verificationStatus === 'under_review'
                ? 'Once approved, you can start accepting requests'
                : 'Wait for approval (usually 24-48 hours)'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Action Button */}
        {verificationStatus === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tintColor }]}
            onPress={handleEditProfile}
          >
            <ThemedText style={styles.actionButtonText}>Complete Profile</ThemedText>
          </TouchableOpacity>
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          style={[styles.refreshButton, { borderColor }]}
          onPress={checkVerificationStatus}
        >
          <ThemedText style={[styles.refreshButtonText, { color: tintColor }]}>
            Check Status
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 24,
  },
  statusCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    marginRight: 12,
    opacity: 0.7,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

