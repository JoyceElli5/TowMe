import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { DocumentUpload } from '@/components/document-upload';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/api';
import {
  getOperatorProfile,
  updateOperatorProfile,
  type OperatorProfileData,
} from '@/lib/services/operatorService';
import { uploadOperatorDocument } from '@/lib/services/operatorStorageService';

export default function OperatorProfileSetupScreen() {
  const router = useRouter();
  const [ghanaCardNumber, setGhanaCardNumber] = useState('');
  const [ghanaCardPhoto, setGhanaCardPhoto] = useState<string | null>(null);
  const [ghanaCardPhotoUri, setGhanaCardPhotoUri] = useState<string | null>(null);

  const [driversLicenseNumber, setDriversLicenseNumber] = useState('');
  const [driversLicensePhoto, setDriversLicensePhoto] = useState<string | null>(null);
  const [driversLicensePhotoUri, setDriversLicensePhotoUri] = useState<string | null>(null);

  const [operatorPhoto, setOperatorPhoto] = useState<string | null>(null);
  const [operatorPhotoUri, setOperatorPhotoUri] = useState<string | null>(null);

  const [vehicleRegistrationNumber, setVehicleRegistrationNumber] = useState('');
  const [vehicleRegistrationPhoto, setVehicleRegistrationPhoto] = useState<string | null>(null);
  const [vehicleRegistrationPhotoUri, setVehicleRegistrationPhotoUri] = useState<string | null>(null);

  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);
  const [insurancePhotoUri, setInsurancePhotoUri] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getOperatorProfile(user.id);
        if (profile) {
          setGhanaCardNumber(profile.ghana_card_number || '');
          setGhanaCardPhoto(profile.ghana_card_photo_url);
          setDriversLicenseNumber(profile.drivers_license_number || '');
          setDriversLicensePhoto(profile.drivers_license_photo_url);
          setOperatorPhoto(profile.operator_photo_url);
          setVehicleRegistrationNumber(profile.vehicle_registration_number || '');
          setVehicleRegistrationPhoto(profile.vehicle_registration_photo_url);
          setInsurancePolicyNumber(profile.insurance_policy_number || '');
          setInsurancePhoto(profile.insurance_photo_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUploadGhanaCard = async (uri: string) => {
    try {
      setIsUploading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const photoUrl = await uploadOperatorDocument(user.id, uri, 'ghana_card');
      setGhanaCardPhoto(photoUrl);
      setGhanaCardPhotoUri(null);
      showToast('Ghana card photo uploaded', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadDriversLicense = async (uri: string) => {
    try {
      setIsUploading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const photoUrl = await uploadOperatorDocument(user.id, uri, 'drivers_license');
      setDriversLicensePhoto(photoUrl);
      setDriversLicensePhotoUri(null);
      showToast('Driver license photo uploaded', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadOperatorPhoto = async (uri: string) => {
    try {
      setIsUploading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const photoUrl = await uploadOperatorDocument(user.id, uri, 'operator_photo');
      setOperatorPhoto(photoUrl);
      setOperatorPhotoUri(null);
      showToast('Operator photo uploaded', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadVehicleRegistration = async (uri: string) => {
    try {
      setIsUploading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const photoUrl = await uploadOperatorDocument(user.id, uri, 'vehicle_registration');
      setVehicleRegistrationPhoto(photoUrl);
      setVehicleRegistrationPhotoUri(null);
      showToast('Vehicle registration photo uploaded', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadInsurance = async (uri: string) => {
    try {
      setIsUploading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const photoUrl = await uploadOperatorDocument(user.id, uri, 'insurance');
      setInsurancePhoto(photoUrl);
      setInsurancePhotoUri(null);
      showToast('Insurance photo uploaded', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!ghanaCardNumber || !ghanaCardPhoto) {
      showToast('Please provide Ghana card number and photo', 'error');
      return;
    }

    if (!driversLicenseNumber || !driversLicensePhoto) {
      showToast('Please provide driver license number and photo', 'error');
      return;
    }

    if (!operatorPhoto) {
      showToast('Please upload your operator photo', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Please login first', 'error');
        router.back();
        return;
      }

      const profileData: OperatorProfileData = {
        ghana_card_number: ghanaCardNumber,
        ghana_card_photo_url: ghanaCardPhoto,
        drivers_license_number: driversLicenseNumber,
        drivers_license_photo_url: driversLicensePhoto,
        operator_photo_url: operatorPhoto,
        vehicle_registration_number: vehicleRegistrationNumber || undefined,
        vehicle_registration_photo_url: vehicleRegistrationPhoto || undefined,
        insurance_policy_number: insurancePolicyNumber || undefined,
        insurance_photo_url: insurancePhoto || undefined,
      };

      await updateOperatorProfile(user.id, profileData);
      showToast('Profile saved successfully! Your profile is under review.', 'success');

      // Navigate to verification pending - operator must wait for admin approval
      router.replace('/screens/operator/verification-pending');
    } catch (error: any) {
      showToast(error.message || 'Failed to save profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" style={styles.loader} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>Complete Your Profile</ThemedText>
        <ThemedText style={styles.subtitle}>
          Please provide the following documents to verify your identity and start operating
        </ThemedText>

        {/* Ghana Card */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ghana Card *</ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Ghana Card Number</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="Enter your Ghana card number"
              placeholderTextColor="#9ca3af"
              value={ghanaCardNumber}
              onChangeText={setGhanaCardNumber}
            />
          </View>
          <DocumentUpload
            label="Ghana Card Photo *"
            value={ghanaCardPhoto}
            onUpload={handleUploadGhanaCard}
            onRemove={() => setGhanaCardPhoto(null)}
            documentType="ghana_card"
          />
        </View>

        {/* Driver's License */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Driver's License *</ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>License Number</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="Enter your driver's license number"
              placeholderTextColor="#9ca3af"
              value={driversLicenseNumber}
              onChangeText={setDriversLicenseNumber}
            />
          </View>
          <DocumentUpload
            label="Driver's License Photo *"
            value={driversLicensePhoto}
            onUpload={handleUploadDriversLicense}
            onRemove={() => setDriversLicensePhoto(null)}
            documentType="drivers_license"
          />
        </View>

        {/* Operator Photo */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Your Photo *</ThemedText>
          <DocumentUpload
            label="Upload your photo"
            value={operatorPhoto}
            onUpload={handleUploadOperatorPhoto}
            onRemove={() => setOperatorPhoto(null)}
            documentType="operator_photo"
            allowCamera={true}
          />
        </View>

        {/* Vehicle Registration (Optional) */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Vehicle Registration (Optional)</ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Registration Number</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="Enter vehicle registration number"
              placeholderTextColor="#9ca3af"
              value={vehicleRegistrationNumber}
              onChangeText={setVehicleRegistrationNumber}
            />
          </View>
          <DocumentUpload
            label="Registration Document"
            value={vehicleRegistrationPhoto}
            onUpload={handleUploadVehicleRegistration}
            onRemove={() => setVehicleRegistrationPhoto(null)}
            documentType="vehicle_registration"
          />
        </View>

        {/* Insurance (Optional) */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Insurance (Optional)</ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Policy Number</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              placeholder="Enter insurance policy number"
              placeholderTextColor="#9ca3af"
              value={insurancePolicyNumber}
              onChangeText={setInsurancePolicyNumber}
            />
          </View>
          <DocumentUpload
            label="Insurance Document"
            value={insurancePhoto}
            onUpload={handleUploadInsurance}
            onRemove={() => setInsurancePhoto(null)}
            documentType="insurance"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: buttonColor }]}
          onPress={handleSave}
          disabled={isLoading || isUploading}
        >
          {isLoading || isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save & Submit for Review</ThemedText>
          )}
        </TouchableOpacity>

        <ThemedText style={styles.note}>
          * Required fields. Your profile will be reviewed before you can start accepting requests.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.semiBold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },

  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  note: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 20,
  },
});

