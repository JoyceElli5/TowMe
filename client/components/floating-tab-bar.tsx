import { useTabBar } from '@/contexts/tab-bar-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Home01Icon, Notification01Icon, TransactionIcon, UserIcon, Wallet01Icon } from 'hugeicons-react-native';
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
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: {
    name: 'Home',
    Icon: Home01Icon,
  },
  dashboard: {
    name: 'Home',
    Icon: Home01Icon,
  },
  earnings: {
    name: 'Earnings',
    Icon: Wallet01Icon,
  },
  notifications: {
    name: 'Activity',
    Icon: Notification01Icon,
  },
  history: {
    name: 'History',
    Icon: TransactionIcon,
  },
  messages: {
    name: 'Messages',
    Icon: Notification01Icon,
  },
  profile: {
    name: 'Profile',
    Icon: UserIcon,
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
  const Icon = config.Icon;
  
  // Theme colors - using dark blue (#003554) for active state
  const activeColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  const inactiveColor = useThemeColor({}, 'icon');

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
        <View style={[styles.glowEffect, { backgroundColor: `${activeColor}25` }]} />
      </Animated.View>

      <Animated.View style={animatedStyle}>
        <Icon
          size={isFocused ? 28 : 24}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={2}
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
  const backgroundColor = useThemeColor({ light: 'rgba(255, 255, 255, 0.95)', dark: 'rgba(31, 41, 55, 0.95)' }, 'background');
  const borderColor = useThemeColor({ light: 'rgba(255, 255, 255, 0.8)', dark: 'rgba(55, 65, 81, 0.8)' }, 'background');
  const { isVisible } = useTabBar();

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.tabBar, { backgroundColor, borderColor }]}>
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
    borderRadius: 40,
    paddingHorizontal: 3,
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
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
  },
});
