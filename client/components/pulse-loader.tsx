/**
 * Pulse Loader Component
 * An animated pulse loader for better visual feedback
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface PulseLoaderProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  pulseColor?: string;
  size?: number;
}

export default function PulseLoader({
  icon = 'car',
  iconColor = '#003554',
  pulseColor = '#e0f2fe',
  size = 80,
}: PulseLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Scale animation for icon
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    scaleAnimation.start();

    return () => {
      pulseAnimation.stop();
      scaleAnimation.stop();
    };
  }, [pulseAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pulseColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.innerCircle,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: (size * 0.7) / 2,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name={icon} size={size * 0.4} color={iconColor} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  innerCircle: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

