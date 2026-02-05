/**
 * Verification Rejected Screen
 * 
 * Shown when operator's verification has been rejected
 */

import { router } from 'expo-router';
import { AlertCircleIcon, ArrowRight01Icon } from 'hugeicons-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function VerificationRejectedScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const errorColor = '#EF4444';

  const handleEditProfile = () => {
    router.push('/screens/operator/profile-setup-screen');
  };

  const handleContactSupport = () => {
    router.push('/screens/user/contact-support-screen');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${errorColor}15` }]}>
          <AlertCircleIcon size={64} color={errorColor} strokeWidth={1.5} />
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>Verification Rejected</ThemedText>

        {/* Description */}
        <ThemedText style={styles.description}>
          Your verification application has been rejected. Please review your submitted documents and ensure they meet our requirements.
        </ThemedText>

        {/* Reasons Card */}
        <ThemedView style={[styles.reasonsCard, { borderColor }]}>
          <ThemedText style={styles.reasonsTitle}>Common Reasons for Rejection:</ThemedText>
          <View style={styles.reasonItem}>
            <ThemedText style={styles.reasonBullet}>•</ThemedText>
            <ThemedText style={styles.reasonText}>Blurry or unclear document photos</ThemedText>
          </View>
          <View style={styles.reasonItem}>
            <ThemedText style={styles.reasonBullet}>•</ThemedText>
            <ThemedText style={styles.reasonText}>Expired documents</ThemedText>
          </View>
          <View style={styles.reasonItem}>
            <ThemedText style={styles.reasonBullet}>•</ThemedText>
            <ThemedText style={styles.reasonText}>Mismatched information</ThemedText>
          </View>
          <View style={styles.reasonItem}>
            <ThemedText style={styles.reasonBullet}>•</ThemedText>
            <ThemedText style={styles.reasonText}>Missing required documents</ThemedText>
          </View>
        </ThemedView>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: errorColor }]}
          onPress={handleEditProfile}
        >
          <ThemedText style={styles.primaryButtonText}>Update Profile</ThemedText>
          <ArrowRight01Icon size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor }]}
          onPress={handleContactSupport}
        >
          <ThemedText style={styles.secondaryButtonText}>Contact Support</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  reasonsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  reasonsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  reasonBullet: {
    fontSize: 16,
    marginRight: 12,
    color: '#EF4444',
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

