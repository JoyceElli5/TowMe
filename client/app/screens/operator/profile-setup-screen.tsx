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

  // Identity
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [ghanaCardPhoto, setGhanaCardPhoto] = useState<string | null>(null);
  const [selfieWithId, setSelfieWithId] = useState<string | null>(null);

  // License
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);

  // Profile photo
  const [operatorPhoto, setOperatorPhoto] = useState<string | null>(null);

  // Vehicle Registration — now REQUIRED
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [vehicleRegPhoto, setVehicleRegPhoto] = useState<string | null>(null);

  // Insurance — now REQUIRED
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);

  const pickImage = async (
    setter: React.Dispatch<React.SetStateAction<string | null>>,
    useCamera = false
  ) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showToast('Camera permission is required', 'error');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setter(result.assets[0].uri);
      }
    } else {
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
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields
    if (!ghanaCardNumber.trim()) return showToast('Ghana Card number is required', 'error');
    if (!ghanaCardPhoto) return showToast('Ghana Card photo is required', 'error');
    if (!selfieWithId) return showToast('Selfie holding your ID is required', 'error');
    if (!licenseNumber.trim()) return showToast("Driver's License number is required", 'error');
    if (!licensePhoto) return showToast("Driver's License photo is required", 'error');
    if (!operatorPhoto) return showToast('Profile photo is required', 'error');
    if (!vehicleRegNumber.trim()) return showToast('Vehicle registration number is required', 'error');
    if (!vehicleRegPhoto) return showToast('Vehicle registration photo is required', 'error');
    if (!insuranceNumber.trim()) return showToast('Insurance policy number is required', 'error');
    if (!insurancePhoto) return showToast('Insurance photo is required', 'error');

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
        selfieWithIdUrl,
        licenseUrl,
        operatorPhotoUrl,
        vehicleRegUrl,
        insuranceUrl,
      ] = await Promise.all([
        uploadImageToSupabase(ghanaCardPhoto!, user.id, 'ghana_card'),
        uploadImageToSupabase(selfieWithId!, user.id, 'selfie_with_id'),
        uploadImageToSupabase(licensePhoto!, user.id, 'drivers_license'),
        uploadImageToSupabase(operatorPhoto!, user.id, 'operator_photo'),
        uploadImageToSupabase(vehicleRegPhoto!, user.id, 'vehicle_reg'),
        uploadImageToSupabase(insurancePhoto!, user.id, 'insurance'),
      ]);

      await updateOperatorProfile(user.id, {
        ghana_card_number: ghanaCardNumber.trim(),
        ghana_card_photo_url: ghanaCardUrl,
        selfie_with_id_photo_url: selfieWithIdUrl,
        drivers_license_number: licenseNumber.trim(),
        drivers_license_photo_url: licenseUrl,
        operator_photo_url: operatorPhotoUrl,
        vehicle_registration_number: vehicleRegNumber.trim(),
        vehicle_registration_photo_url: vehicleRegUrl,
        insurance_policy_number: insuranceNumber.trim(),
        insurance_photo_url: insuranceUrl,
      });

      // Trigger under-review email (fire-and-forget — never block UX on email)
      try {
        const { api } = await import('@/lib/api/client');
        await api.post('/users/me/notify-profile-submitted', {});
      } catch (emailErr) {
        console.warn('Failed to trigger under-review email:', emailErr);
      }

      showToast('Profile submitted! Check your email for confirmation.', 'success');
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
    onCamera,
    hint,
  }: {
    label: string;
    uri: string | null;
    onPress: () => void;
    onCamera?: () => void;
    hint?: string;
  }) => (
    <View style={styles.photoBoxWrapper}>
      {uri ? (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
          <TouchableOpacity
            style={styles.photoEditBadge}
            onPress={onCamera || onPress}
            disabled={isSubmitting}
          >
            <Ionicons name="pencil" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {hint ? <Text style={styles.photoHintText}>{hint}</Text> : null}
          <View style={styles.uploadButtonsRow}>
            {onCamera && (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: '#003554' }]}
                onPress={onCamera}
                disabled={isSubmitting}
              >
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: '#003554', borderWidth: 1.5 }]}
              onPress={onPress}
              disabled={isSubmitting}
            >
              <Ionicons name="image-outline" size={18} color="#003554" />
              <Text style={[styles.uploadButtonText, { color: '#003554' }]}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.photoBox}
            onPress={onCamera || onPress}
            disabled={isSubmitting}
          >
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color="#6b7280" />
              <Text style={styles.photoPlaceholderText}>{label} *</Text>
              <Text style={styles.photoHint}>Tap to upload</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/screens/auth/login-screen')}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              All documents below are required for verification. Make sure photos are clear and readable.
            </Text>
          </View>

          <Text style={styles.requiredNote}>
            <Text style={styles.required}>*</Text> All fields are required
          </Text>

          {/* Ghana Card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ghana Card / National ID <Text style={styles.required}>*</Text>
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
              onCamera={() => pickImage(setGhanaCardPhoto, true)}
            />
          </View>

          {/* Selfie with ID — new anti-fraud requirement */}
          <View style={[styles.section, styles.selfieSection]}>
            <View style={styles.selfieHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#003554" />
              <Text style={styles.sectionTitle}>
                {' '}Selfie Holding ID Card <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <Text style={styles.selfieDescription}>
              Take a clear photo of yourself holding your Ghana Card or National ID beside your face. This helps us confirm the ID belongs to you.
            </Text>
            <PhotoUploadBox
              label="Selfie with ID"
              uri={selfieWithId}
              onPress={() => pickImage(setSelfieWithId)}
              onCamera={() => pickImage(setSelfieWithId, true)}
              hint="Position your face and ID clearly in frame"
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
              onCamera={() => pickImage(setLicensePhoto, true)}
            />
          </View>

          {/* Profile Photo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Profile / Headshot Photo <Text style={styles.required}>*</Text>
            </Text>
            <PhotoUploadBox
              label="Profile Photo"
              uri={operatorPhoto}
              onPress={() => pickImage(setOperatorPhoto)}
              onCamera={() => pickImage(setOperatorPhoto, true)}
            />
          </View>

          {/* Vehicle Registration — now required */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Vehicle Registration <Text style={styles.required}>*</Text>
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
              onCamera={() => pickImage(setVehicleRegPhoto, true)}
            />
          </View>

          {/* Insurance — now required */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Insurance Policy <Text style={styles.required}>*</Text>
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
              onCamera={() => pickImage(setInsurancePhoto, true)}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>
                  Uploading & Submitting...
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
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
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
  header: { marginBottom: 8 },
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
  required: { color: '#ef4444', fontWeight: '600' },
  section: { marginBottom: 28 },
  selfieSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selfieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selfieDescription: {
    fontSize: 13,
    color: '#3b82f6',
    lineHeight: 19,
    marginBottom: 14,
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
  photoBoxWrapper: { marginTop: 4 },
  photoPreviewContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#003554',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  uploadButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  photoBox: {
    height: 120,
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
  photoHintText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  photoHint: { fontSize: 12, color: '#9ca3af' },
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
  buttonDisabled: { opacity: 0.7 },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
});
