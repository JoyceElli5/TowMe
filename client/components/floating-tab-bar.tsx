/**
 * Floating Tab Bar Component
 *
 * A modern, pill-shaped floating bottom tab bar with:
 * - Frosted glass effect (semi-transparent background)
 * - Soft shadow for depth
 * - Scale animation for active tabs
 * - Haptic feedback on tab press
 */

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab configuration
interface TabConfig {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    name: 'Home',
    icon: 'map-outline',
    iconFilled: 'map',
  },
  history: {
    name: 'History',
    icon: 'time-outline',
    iconFilled: 'time',
  },
  messages: {
    name: 'Messages',
    icon: 'chatbubble-outline',
    iconFilled: 'chatbubble',
  },
  profile: {
    name: 'Profile',
    icon: 'person-outline',
    iconFilled: 'person',
  },
};

// Tab item component with animation
function TabItem({
  routeName,
  isFocused,
  onPress,
  onLongPress,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const config = TAB_CONFIG[routeName] || TAB_CONFIG.index;

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      isFocused ? 1 : 0,
      [0, 1],
      [1, 1.1]
    );

    return {
      transform: [{ scale: scale.value * scaleValue }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(isFocused ? 1 : 0, { damping: 15, stiffness: 200 }),
      transform: [{ scale: withSpring(isFocused ? 1 : 0.8, { damping: 15, stiffness: 200 }) }],
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      {/* Glow effect behind active icon */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <View style={styles.glowEffect} />
      </Animated.View>

      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isFocused ? config.iconFilled : config.icon}
          size={isFocused ? 28 : 24}
          color={isFocused ? '#3B82F6' : '#9CA3AF'}
        />
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 360,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    // Border for subtle definition
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
});
