import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { getCurrentUser } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { updateOperatorProfile } from '@/lib/services/operatorService';

async function uploadImageToSupabase(
  uri: string,
  userId: string,
  docType: string
): Promise<string> {
  const fileName = `${userId}/${docType}_${Date.now()}.jpg`;

  // Read as base64 (works reliably in React Native / Expo Go)
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from('operator-documents')
    .upload(fileName, bytes, { contentType: 'image/jpeg', upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('operator-documents')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export default function OperatorProfileSetupScreen() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [ghanaCardPhoto, setGhanaCardPhoto] = useState<string | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [operatorPhoto, setOperatorPhoto] = useState<string | null>(null);
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [vehicleRegPhoto, setVehicleRegPhoto] = useState<string | null>(null);
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);

  const pickImage = async (
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission to access photos is required', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!ghanaCardNumber.trim()) {
      showToast('Ghana Card number is required', 'error');
      return;
    }
    if (!ghanaCardPhoto) {
      showToast('Ghana Card photo is required', 'error');
      return;
    }
    if (!licenseNumber.trim()) {
      showToast("Driver's License number is required", 'error');
      return;
    }
    if (!licensePhoto) {
      showToast("Driver's License photo is required", 'error');
      return;
    }
    if (!operatorPhoto) {
      showToast('Your photo is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/screens/auth/login-screen');
        return;
      }

      showToast('Uploading documents...', 'success');

      const [
        ghanaCardUrl,
        licenseUrl,
        operatorPhotoUrl,
        vehicleRegUrl,
        insuranceUrl,
      ] = await Promise.all([
        uploadImageToSupabase(ghanaCardPhoto, user.id, 'ghana_card'),
        uploadImageToSupabase(licensePhoto, user.id, 'drivers_license'),
        uploadImageToSupabase(operatorPhoto, user.id, 'operator_photo'),
        vehicleRegPhoto
          ? uploadImageToSupabase(vehicleRegPhoto, user.id, 'vehicle_reg')
          : Promise.resolve(undefined),
        insurancePhoto
          ? uploadImageToSupabase(insurancePhoto, user.id, 'insurance')
          : Promise.resolve(undefined),
      ]);

      await updateOperatorProfile(user.id, {
        ghana_card_number: ghanaCardNumber.trim(),
        ghana_card_photo_url: ghanaCardUrl,
        drivers_license_number: licenseNumber.trim(),
        drivers_license_photo_url: licenseUrl,
        operator_photo_url: operatorPhotoUrl,
        ...(vehicleRegNumber.trim() && { vehicle_registration_number: vehicleRegNumber.trim() }),
        ...(vehicleRegUrl && { vehicle_registration_photo_url: vehicleRegUrl }),
        ...(insuranceNumber.trim() && { insurance_policy_number: insuranceNumber.trim() }),
        ...(insuranceUrl && { insurance_photo_url: insuranceUrl }),
      });

      showToast('Profile submitted for review!', 'success');
      router.replace('/screens/operator/verification-pending');
    } catch (error: any) {
      console.error('Profile setup error:', error);
      showToast(error.message || 'Failed to submit profile', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PhotoUploadBox = ({
    label,
    uri,
    onPress,
    required,
  }: {
    label: string;
    uri: string | null;
    onPress: () => void;
    required?: boolean;
  }) => (
    <TouchableOpacity style={styles.photoBox} onPress={onPress} disabled={isSubmitting}>
      {uri ? (
        <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="camera-outline" size={28} color="#6b7280" />
          <Text style={styles.photoPlaceholderText}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
          <Text style={styles.photoHint}>Tap to upload</Text>
        </View>
      )}
      {uri && (
        <View style={styles.photoEditBadge}>
          <Ionicons name="pencil" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/screens/auth/login-screen')}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Upload your documents to get verified and start accepting requests.
            </Text>
          </View>

          {/* Required badge */}
          <Text style={styles.requiredNote}>
            <Text style={styles.required}>*</Text> Required fields
          </Text>

          {/* Ghana Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ghana Card <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Ghana Card number"
              placeholderTextColor="#9ca3af"
              value={ghanaCardNumber}
              onChangeText={setGhanaCardNumber}
              autoCapitalize="characters"
              editable={!isSubmitting}
            />
            <PhotoUploadBox
              label="Ghana Card Photo"
              uri={ghanaCardPhoto}
              onPress={() => pickImage(setGhanaCardPhoto)}
              required
            />
          </View>

          {/* Driver's License */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Driver's License <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Driver's License number"
              placeholderTextColor="#9ca3af"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
              editable={!isSubmitting}
            />
            <PhotoUploadBox
              label="License Photo"
              uri={licensePhoto}
              onPress={() => pickImage(setLicensePhoto)}
              required
            />
          </View>

          {/* Operator Photo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Your Photo <Text style={styles.required}>*</Text>
            </Text>
            <PhotoUploadBox
              label="Profile Photo"
              uri={operatorPhoto}
              onPress={() => pickImage(setOperatorPhoto)}
              required
            />
          </View>

          {/* Vehicle Registration (optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Vehicle Registration{' '}
              <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter vehicle registration number"
              placeholderTextColor="#9ca3af"
              value={vehicleRegNumber}
              onChangeText={setVehicleRegNumber}
              autoCapitalize="characters"
              editable={!isSubmitting}
            />
            <PhotoUploadBox
              label="Registration Photo"
              uri={vehicleRegPhoto}
              onPress={() => pickImage(setVehicleRegPhoto)}
            />
          </View>

          {/* Insurance (optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Insurance Policy{' '}
              <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter insurance policy number"
              placeholderTextColor="#9ca3af"
              value={insuranceNumber}
              onChangeText={setInsuranceNumber}
              autoCapitalize="characters"
              editable={!isSubmitting}
            />
            <PhotoUploadBox
              label="Insurance Photo"
              uri={insurancePhoto}
              onPress={() => pickImage(setInsurancePhoto)}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>
                  Submitting...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit for Review</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  requiredNote: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 20,
  },
  required: {
    color: '#ef4444',
    fontWeight: '600',
  },
  optional: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '400',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  photoBox: {
    height: 140,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  photoHint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#003554',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
