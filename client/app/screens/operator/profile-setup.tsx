/**
 * Operator Profile Setup Screen
 * 
 * First step of operator onboarding - collect business information
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/hooks/use-toast';
import { ApiError, createOperatorProfile } from '@/lib/api';

export default function OperatorProfileSetupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (!businessName.trim()) {
      showToast('Please enter your business name', 'error');
      return;
    }
    if (!businessPhone.trim()) {
      showToast('Please enter your business phone number', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await createOperatorProfile({
        businessName: businessName.trim(),
        businessAddress: businessAddress.trim() || undefined,
        businessPhone: businessPhone.trim(),
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : 0,
      });

      showToast('Profile created successfully!', 'success');
      
      // Navigate to vehicle registration
      setTimeout(() => {
        router.push('/screens/operator/vehicle-register' as any);
      }, 500);
    } catch (error) {
      console.error('Profile setup error:', error);
      if (error instanceof ApiError) {
        if (error.message.includes('operator_profiles') || error.message.includes('relation')) {
          showToast('Database not ready. Please contact support.', 'error');
        } else {
          showToast(error.message || 'Failed to create profile', 'error');
        }
      } else {
        showToast('An unexpected error occurred', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping profile details, go straight to vehicle
    router.push('/screens/operator/vehicle-register' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
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
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 3</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="business" size={40} color="#F97316" />
            </View>
            <Text style={styles.title}>Business Profile</Text>
            <Text style={styles.subtitle}>
              Tell us about your towing business. This helps customers trust your services.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Kwame's Towing Services"
                placeholderTextColor="#9ca3af"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>

            {/* Business Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Phone *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 024 123 4567"
                placeholderTextColor="#9ca3af"
                value={businessPhone}
                onChangeText={setBusinessPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Business Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Nungua, Accra"
                placeholderTextColor="#9ca3af"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Years of Experience */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Years of Experience</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5"
                placeholderTextColor="#9ca3af"
                value={yearsOfExperience}
                onChangeText={setYearsOfExperience}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              You can update this information later from your profile settings.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    padding: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
