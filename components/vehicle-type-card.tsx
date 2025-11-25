/**
 * VehicleTypeCard Component
 * 
 * A horizontal scrollable card selector for vehicle types.
 * Shows vehicle type icons with modern styling and highlights selected type.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { VEHICLE_OPTIONS, VehicleType } from '@/constants/pricing';

// Re-export types for convenience
export { VehicleType, VEHICLE_OPTIONS };

interface VehicleTypeCardProps {
  /** Currently selected vehicle type */
  selectedType: VehicleType | null;
  /** Callback when a vehicle type is selected */
  onSelect: (type: VehicleType) => void;
}

export default function VehicleTypeCard({
  selectedType,
  onSelect,
}: VehicleTypeCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Vehicle Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {VEHICLE_OPTIONS.map((vehicle) => {
          const isSelected = selectedType === vehicle.id;
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                isSelected && styles.vehicleCardSelected,
              ]}
              onPress={() => onSelect(vehicle.id)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${vehicle.label} vehicle type`}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}
              >
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
              </View>
              <Text
                style={[
                  styles.vehicleLabel,
                  isSelected && styles.vehicleLabelSelected,
                ]}
              >
                {vehicle.label}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  vehicleCard: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleCardSelected: {
    borderColor: '#003554',
    backgroundColor: '#f0f9ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: '#dbeafe',
  },
  vehicleIcon: {
    fontSize: 24,
  },
  vehicleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  vehicleLabelSelected: {
    color: '#003554',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
