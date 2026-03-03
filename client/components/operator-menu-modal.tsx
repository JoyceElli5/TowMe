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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { logout } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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

  type IconRenderer = (color: string) => JSX.Element;

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
    icon: IconRenderer;
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }> = [
    {
      icon: (color) => <Ionicons name="person-outline" size={24} color={color} />,
      label: 'Profile',
      onPress: () => {
        onClose();
        router.push('/screens/operator/profile');
      },
    },
    {
      icon: (color) => <Ionicons name="wallet-outline" size={24} color={color} />,
      label: 'Earnings',
      onPress: () => {
        onClose();
        // Navigate to earnings screen (if exists)
        showToast('Earnings screen coming soon', 'info');
      },
    },
    {
      icon: (color) => <Ionicons name="time-outline" size={24} color={color} />,
      label: 'Trip History',
      onPress: () => {
        onClose();
        router.push('/screens/operator/profile');
      },
    },
    {
      icon: (color) => <Ionicons name="settings-outline" size={24} color={color} />,
      label: 'Settings',
      onPress: () => {
        onClose();
        showToast('Settings screen coming soon', 'info');
      },
    },
    {
      icon: (color) => <Ionicons name="log-out-outline" size={24} color={color} />,
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
                <Ionicons name="close" size={24} color={iconColor} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {menuItems.map((item, index) => {
                const color = item.destructive ? '#EF4444' : iconColor;
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
                    {item.icon(color)}
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

