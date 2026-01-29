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
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VEHICLE_OPTIONS, VehicleType } from '@/constants/pricing';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

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
  const cardBg = useThemeColor({ light: '#f9fafb', dark: '#1F2937' }, 'background');
  const selectedCardBg = useThemeColor({ light: '#f0f9ff', dark: '#1E3A5F' }, 'background');
  const iconBg = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const selectedIconBg = useThemeColor({ light: '#dbeafe', dark: '#3B82F6' }, 'background');
  const borderColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  const labelColor = useThemeColor({}, 'text');
  const selectedLabelColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  const inactiveLabelColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Select Vehicle Type</ThemedText>
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
                {
                  backgroundColor: isSelected ? selectedCardBg : cardBg,
                  borderColor: isSelected ? borderColor : 'transparent',
                },
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
                  {
                    backgroundColor: isSelected ? selectedIconBg : iconBg,
                  },
                ]}
              >
                <ThemedText style={styles.vehicleIcon}>{vehicle.icon}</ThemedText>
              </View>
              <ThemedText
                style={[
                  styles.vehicleLabel,
                  {
                    color: isSelected ? selectedLabelColor : inactiveLabelColor,
                    fontFamily: isSelected ? Fonts.semiBold : Fonts.medium,
                  },
                ]}
              >
                {vehicle.label}
              </ThemedText>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: borderColor }]}>
                  <ThemedText style={styles.checkmarkText}>✓</ThemedText>
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
    fontFamily: Fonts.semiBold,
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  vehicleCard: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    minWidth: 80,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vehicleIcon: {
    fontSize: 24,
  },
  vehicleLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
});
