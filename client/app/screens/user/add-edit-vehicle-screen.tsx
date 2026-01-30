import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/hooks/use-toast';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { VEHICLE_OPTIONS, VehicleType } from '@/constants/pricing';
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
  type UserVehicle,
} from '@/lib/services/vehicleService';
import { uploadVehiclePhoto } from '@/lib/services/storageService';
import { getCurrentUser } from '@/lib/api';

export default function AddEditVehicleScreen() {
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const isEditing = !!params.vehicleId;
  
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  // Load vehicle data if editing
  useEffect(() => {
    const loadVehicle = async () => {
      if (isEditing && params.vehicleId) {
        setIsLoadingVehicle(true);
        try {
          const vehicle = await getVehicleById(params.vehicleId);
          if (vehicle) {
            setVehicleType(vehicle.vehicle_type);
            setMake(vehicle.make || '');
            setModel(vehicle.model || '');
            setColor(vehicle.color || '');
            setPlateNumber(vehicle.plate_number || '');
            setPhotoUrl(vehicle.photo_url);
          }
        } catch (error: any) {
          showToast('Failed to load vehicle', 'error');
          router.back();
        } finally {
          setIsLoadingVehicle(false);
        }
      }
    };
    loadVehicle();
  }, [isEditing, params.vehicleId]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access camera roll is required', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error: any) {
      showToast('Failed to pick image', 'error');
    }
  };

  const handleSave = async () => {
    if (!vehicleType) {
      showToast('Please select a vehicle type', 'error');
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
      
      // Ensure user has an id
      if (!user.id) {
        showToast('Invalid user session', 'error');
        router.back();
        return;
      }

      let finalPhotoUrl = photoUrl;

      // Upload photo if new one selected
      if (photoUri && !photoUrl) {
        setIsUploading(true);
        finalPhotoUrl = await uploadVehiclePhoto(user.id, photoUri);
        setPhotoUrl(finalPhotoUrl);
        setIsUploading(false);
      }

      const vehicleData = {
        vehicle_type: vehicleType,
        make: make || undefined,
        model: model || undefined,
        color: color || undefined,
        plate_number: plateNumber || undefined,
        photo_url: finalPhotoUrl || undefined,
      };

      if (isEditing && params.vehicleId) {
        await updateVehicle(params.vehicleId, vehicleData);
        showToast('Vehicle updated successfully', 'success');
      } else {
        await createVehicle(user.id, vehicleData);
        showToast('Vehicle added successfully', 'success');
      }

      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to save vehicle', 'error');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (!params.vehicleId) return;

    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(params.vehicleId!);
              showToast('Vehicle deleted successfully', 'success');
              router.back();
            } catch (error: any) {
              showToast(error.message || 'Failed to delete vehicle', 'error');
            }
          },
        },
      ]
    );
  };

  if (isLoadingVehicle) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" style={styles.loader} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Vehicle Type Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Vehicle Type *</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {VEHICLE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: vehicleType === option.id ? buttonColor : backgroundColor,
                    borderColor: vehicleType === option.id ? buttonColor : borderColor,
                  },
                ]}
                onPress={() => setVehicleType(option.id)}
              >
                <ThemedText style={styles.typeIcon}>{option.icon}</ThemedText>
                <ThemedText style={styles.typeLabel}>{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Make</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., Toyota"
            placeholderTextColor="#9ca3af"
            value={make}
            onChangeText={setMake}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Model</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., Camry"
            placeholderTextColor="#9ca3af"
            value={model}
            onChangeText={setModel}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Color</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., Red"
            placeholderTextColor="#9ca3af"
            value={color}
            onChangeText={setColor}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Plate Number</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, color: textColor }]}
            placeholder="e.g., GR 1234-20"
            placeholderTextColor="#9ca3af"
            value={plateNumber}
            onChangeText={setPlateNumber}
          />
        </View>

        {/* Photo Upload */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Vehicle Photo</ThemedText>
          <TouchableOpacity
            style={[styles.photoButton, { borderColor }]}
            onPress={handlePickImage}
          >
            {photoUri || photoUrl ? (
              <Image
                source={{ uri: photoUri || photoUrl || undefined }}
                style={styles.photo}
              />
            ) : (
              <ThemedText style={styles.photoPlaceholder}>
                Tap to add photo
              </ThemedText>
            )}
          </TouchableOpacity>
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
            <ThemedText style={styles.saveButtonText}>
              {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Delete Button (only when editing) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <ThemedText style={styles.deleteButtonText}>Delete Vehicle</ThemedText>
          </TouchableOpacity>
        )}
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginBottom: 8,
  },
  typeScroll: {
    marginTop: 8,
  },
  typeOption: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 80,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  photoButton: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    opacity: 0.6,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  deleteButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});

