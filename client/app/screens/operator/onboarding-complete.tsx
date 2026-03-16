/**
 * Onboarding Complete Screen
 * 
 * Final screen after operator completes onboarding - shows verification status
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingCompleteScreen() {
  const handleGoToDashboard = () => {
    router.replace('/screens/operator/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="#ffffff" />
          </View>
          <View style={styles.sparkle1}>
            <Ionicons name="sparkles" size={24} color="#F97316" />
          </View>
          <View style={styles.sparkle2}>
            <Ionicons name="star" size={20} color="#FBBF24" />
          </View>
        </View>

        {/* Title & Message */}
        <Text style={styles.title}>You&apos;re All Set!</Text>
        <Text style={styles.subtitle}>
          Your profile has been submitted for verification. Our team will review your documents within 24-48 hours.
        </Text>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="time" size={24} color="#F97316" />
            <Text style={styles.statusTitle}>Verification Pending</Text>
          </View>
          <Text style={styles.statusDescription}>
            You&apos;ll receive a notification once your account is verified. In the meantime, you can explore the app.
          </Text>
        </View>

        {/* What's Next */}
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>What happens next?</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Document Review</Text>
              <Text style={styles.stepDescription}>Our team verifies your submitted documents</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Approval Notification</Text>
              <Text style={styles.stepDescription}>You&apos;ll be notified when verified</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, styles.stepNumberLast]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Start Accepting Jobs</Text>
              <Text style={styles.stepDescription}>Go online and start earning!</Text>
            </View>
          </View>
        </View>

        {/* Contact Support */}
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.supportButtonText}>Need help? Contact Support</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoToDashboard}
        >
          <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginTop: 24,
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 10,
    left: -15,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9A3412',
  },
  statusDescription: {
    fontSize: 14,
    color: '#C2410C',
    lineHeight: 20,
  },
  nextStepsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberLast: {
    backgroundColor: '#10B981',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  supportButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
