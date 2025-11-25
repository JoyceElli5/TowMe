/**
 * AddressInputCard Component
 * 
 * A modern, styled input card for pickup and destination addresses.
 * Features a rounded card design with a location pin icon and touchable area
 * that can open a Google Places autocomplete (or placeholder).
 */

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
        <Text style={styles.iconText}>{isPickup ? '📍' : '🎯'}</Text>
      </View>

      {/* Address Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.label}>{isPickup ? 'From' : 'To'}</Text>
        <Text
          style={[styles.addressText, !value && styles.placeholderText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value || placeholder}
        </Text>
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
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  iconText: {
    fontSize: 18,
  },
  contentContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9ca3af',
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
