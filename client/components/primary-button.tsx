/**
 * PrimaryButton Component
 * 
 * A large, rounded, modern button with loading state support.
 * Features smooth animations and haptic feedback.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface PrimaryButtonProps {
  /** Button label text */
  label: string;
  /** Loading state label */
  loadingLabel?: string;
  /** Whether button is in loading state */
  isLoading?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function PrimaryButton({
  label,
  loadingLabel = 'Loading...',
  isLoading = false,
  disabled = false,
  onPress,
  variant = 'primary',
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.button, styles.secondaryButton];
      case 'outline':
        return [styles.button, styles.outlineButton];
      default:
        return [styles.button, styles.primaryButton];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.buttonText, styles.secondaryButtonText];
      case 'outline':
        return [styles.buttonText, styles.outlineButtonText];
      default:
        return [styles.buttonText, styles.primaryButtonText];
    }
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            color={variant === 'outline' ? '#003554' : '#ffffff'}
            size="small"
          />
          <Text style={[...getTextStyle(), styles.loadingText]}>
            {loadingLabel}
          </Text>
        </View>
      ) : (
        <Text style={getTextStyle()}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  primaryButton: {
    backgroundColor: '#003554',
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#0a7ea4',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#003554',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#ffffff',
  },
  outlineButtonText: {
    color: '#003554',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
});
