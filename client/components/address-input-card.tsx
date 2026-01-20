/**
 * AddressInputCard Component
 * 
 * A modern, styled input card for pickup and destination addresses.
 * Features a rounded card design with a location pin icon and touchable area
 * that can open a Google Places autocomplete (or placeholder).
 */

import { ThemedText } from '@/components/themed-text';
import { Flag01Icon, Location01Icon } from 'hugeicons-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddressInputCardProps {
  /** Type of address input - 'pickup' or 'destination' */
  type: 'pickup' | 'destination';
  /** Current address value */
  value: string;
  /** Placeholder text when no value */
  placeholder: string;
  /** Callback when card is pressed */
  onPress: () => void;
}

export default function AddressInputCard({
  type,
  value,
  placeholder,
  onPress,
}: AddressInputCardProps) {
  const isPickup = type === 'pickup';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${isPickup ? 'Pickup' : 'Destination'} location: ${value || placeholder}`}
    >
      {/* Location Pin Icon */}
      <View style={[styles.iconContainer, isPickup ? styles.pickupIcon : styles.destinationIcon]}>
        {isPickup ? (
          <Location01Icon size={20} color="#3B82F6" />
        ) : (
          <Flag01Icon size={20} color="#10B981" />
        )}
      </View>

      {/* Address Content */}
      <View style={styles.contentContainer}>
        <ThemedText style={styles.label}>{isPickup ? 'From' : 'To'}</ThemedText>
        <ThemedText
          style={[styles.addressText, !value && styles.placeholderText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value || placeholder}
        </ThemedText>
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#9ca3af',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickupIcon: {
    backgroundColor: '#dcfce7',
  },
  destinationIcon: {
    backgroundColor: '#fee2e2',
  },
  contentContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
  },
  placeholderText: {
    fontWeight: '400',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: '300',
  },
});
