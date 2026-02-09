/**
 * Vehicle Registration Screen
 * 
 * Second step of operator onboarding - register tow truck details
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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
import { ApiError, registerVehicle, TowTruckType, VehicleType } from '@/lib/api';

const TOW_TRUCK_TYPES: { value: TowTruckType; label: string; description: string }[] = [
  { value: 'flatbed', label: 'Flatbed', description: 'Best for all vehicle types' },
  { value: 'wheel_lift', label: 'Wheel Lift', description: 'Good for cars & SUVs' },
  { value: 'integrated', label: 'Integrated', description: 'Heavy-duty towing' },
  { value: 'hook_and_chain', label: 'Hook & Chain', description: 'Basic towing' },
];

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Cars' },
  { value: 'saloon', label: 'Saloon' },
  { value: 'suv', label: 'SUVs' },
  { value: 'van', label: 'Vans' },
  { value: 'truck', label: 'Trucks' },
  { value: 'motorcycle', label: 'Motorcycles' },
];

export default function VehicleRegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const { showToast } = useToast();
  
  // Form state
  const [towTruckType, setTowTruckType] = useState<TowTruckType>('flatbed');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [canTowTypes, setCanTowTypes] = useState<VehicleType[]>(['car', 'saloon']);

  const toggleVehicleType = (type: VehicleType) => {
    setCanTowTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getSelectedTypeLabel = () => {
    const selected = TOW_TRUCK_TYPES.find(t => t.value === towTruckType);
    return selected ? selected.label : 'Select Type';
  };

  const handleSubmit = async () => {
    // Validation
    if (!make.trim()) {
      showToast('Please enter the vehicle make', 'error');
      return;
    }
    if (!model.trim()) {
      showToast('Please enter the vehicle model', 'error');
      return;
    }
    if (!year.trim() || parseInt(year) < 1990 || parseInt(year) > new Date().getFullYear() + 1) {
      showToast('Please enter a valid year', 'error');
      return;
    }
    if (!color.trim()) {
      showToast('Please enter the vehicle color', 'error');
      return;
    }
    if (!plateNumber.trim()) {
      showToast('Please enter the plate number', 'error');
      return;
    }
    if (!maxCapacity.trim() || parseInt(maxCapacity) < 500) {
      showToast('Please enter a valid towing capacity (minimum 500kg)', 'error');
      return;
    }
    if (canTowTypes.length === 0) {
      showToast('Please select at least one vehicle type you can tow', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await registerVehicle({
        towTruckType,
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        color: color.trim(),
        plateNumber: plateNumber.trim().toUpperCase(),
        maxTowingCapacityKg: parseInt(maxCapacity, 10),
        canTowTypes,
      });

      showToast('Vehicle registered successfully!', 'success');
      
      // Navigate to document upload
      setTimeout(() => {
        router.push('/screens/operator/documents-upload' as any);
      }, 500);
    } catch (error) {
      console.error('Vehicle registration error:', error);
      if (error instanceof ApiError) {
        showToast(error.message || 'Failed to register vehicle', 'error');
      } else {
        showToast('An unexpected error occurred', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 3</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="car-sport" size={40} color="#F97316" />
            </View>
            <Text style={styles.title}>Register Your Tow Truck</Text>
            <Text style={styles.subtitle}>
              Add your tow truck details. You can add more vehicles later.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Tow Truck Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tow Truck Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowTypePicker(true)}
              >
                <Text style={styles.dropdownButtonText}>{getSelectedTypeLabel()}</Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Type Picker Modal */}
            <Modal
              visible={showTypePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowTypePicker(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowTypePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Tow Truck Type</Text>
                    <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                      <Ionicons name="close" size={24} color="#111827" />
                    </TouchableOpacity>
                  </View>
                  {TOW_TRUCK_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.modalOption,
                        towTruckType === type.value && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setTowTruckType(type.value);
                        setShowTypePicker(false);
                      }}
                    >
                      <View>
                        <Text style={[
                          styles.modalOptionLabel,
                          towTruckType === type.value && styles.modalOptionLabelSelected,
                        ]}>{type.label}</Text>
                        <Text style={styles.modalOptionDescription}>{type.description}</Text>
                      </View>
                      {towTruckType === type.value && (
                        <Ionicons name="checkmark-circle" size={24} color="#F97316" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            {/* Make & Model Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Make *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Isuzu"
                  placeholderTextColor="#9ca3af"
                  value={make}
                  onChangeText={setMake}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Model *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., NPR"
                  placeholderTextColor="#9ca3af"
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Year & Color Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Year *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2020"
                  placeholderTextColor="#9ca3af"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Color *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., White"
                  placeholderTextColor="#9ca3af"
                  value={color}
                  onChangeText={setColor}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Plate Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plate Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., GR 1234-20"
                placeholderTextColor="#9ca3af"
                value={plateNumber}
                onChangeText={setPlateNumber}
                autoCapitalize="characters"
              />
            </View>

            {/* Max Towing Capacity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Max Towing Capacity (kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 3500"
                placeholderTextColor="#9ca3af"
                value={maxCapacity}
                onChangeText={setMaxCapacity}
                keyboardType="number-pad"
              />
              <Text style={styles.helperText}>
                Enter the maximum weight your truck can tow
              </Text>
            </View>

            {/* Can Tow Types */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Types You Can Tow *</Text>
              <View style={styles.chipContainer}>
                {VEHICLE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.chip,
                      canTowTypes.includes(type.value) && styles.chipSelected,
                    ]}
                    onPress={() => toggleVehicleType(type.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        canTowTypes.includes(type.value) && styles.chipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                    {canTowTypes.includes(type.value) && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Button */}
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
  backButton: {
    marginBottom: 16,
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
    marginBottom: 24,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionSelected: {
    backgroundColor: '#FFF7ED',
  },
  modalOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  modalOptionLabelSelected: {
    color: '#F97316',
  },
  modalOptionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  chipSelected: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
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
