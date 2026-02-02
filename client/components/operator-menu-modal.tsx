/**
 * Operator Menu Modal
 * 
 * Bottom sheet menu for operator dashboard
 */

import { router } from 'expo-router';
import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UserIcon,
  Wallet01Icon,
  Settings01Icon,
  Logout01Icon,
  Close01Icon,
} from 'hugeicons-react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { logout } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert } from 'react-native';

interface OperatorMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function OperatorMenuModal({ visible, onClose }: OperatorMenuModalProps) {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/screens/auth/login-screen');
            } catch (error) {
              console.error('Logout error:', error);
              showToast('Failed to logout', 'error');
            }
          },
        },
      ]
    );
  };

  const menuItems: Array<{
    icon: React.ComponentType<any> | (() => JSX.Element);
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }> = [
    {
      icon: UserIcon,
      label: 'Profile',
      onPress: () => {
        onClose();
        router.push('/screens/operator/profile');
      },
    },
    {
      icon: Wallet01Icon,
      label: 'Earnings',
      onPress: () => {
        onClose();
        // Navigate to earnings screen (if exists)
        showToast('Earnings screen coming soon', 'info');
      },
    },
    {
      icon: () => <Ionicons name="time-outline" size={24} color={iconColor} />,
      label: 'Trip History',
      onPress: () => {
        onClose();
        router.push('/screens/operator/profile');
      },
    },
    {
      icon: Settings01Icon,
      label: 'Settings',
      onPress: () => {
        onClose();
        showToast('Settings screen coming soon', 'info');
      },
    },
    {
      icon: Logout01Icon,
      label: 'Logout',
      onPress: handleLogout,
      destructive: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.menuContainer, { backgroundColor }]}>
          <SafeAreaView edges={['bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
              <ThemedText style={styles.headerTitle}>Menu</ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Close01Icon size={24} color={iconColor} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isFunctionComponent = typeof Icon === 'function' && !Icon.prototype;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      { borderBottomColor: borderColor },
                      index === menuItems.length - 1 && styles.lastMenuItem,
                    ]}
                    onPress={item.onPress}
                  >
                    {isFunctionComponent ? (
                      <Icon />
                    ) : (
                      <Icon
                        size={24}
                        color={item.destructive ? '#EF4444' : iconColor}
                        strokeWidth={2}
                      />
                    )}
                    <ThemedText
                      style={[
                        styles.menuItemText,
                        item.destructive && { color: '#EF4444' },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
});

