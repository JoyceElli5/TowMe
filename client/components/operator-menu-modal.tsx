/**
 * Operator Menu Modal
 * 
 * Bottom sheet menu for operator dashboard
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { logout } from '@/lib/api';

interface OperatorMenuModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function OperatorMenuModal({ visible, onClose }: OperatorMenuModalProps) {
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const iconColor = useThemeColor({}, 'icon');

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

  const menuItems: {
    renderIcon: (color: string) => React.ReactNode;
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }[] = [
    {
      renderIcon: (color) => <Ionicons name="person-outline" size={24} color={color} />,
      label: 'Profile',
      onPress: () => {
        onClose();
        router.push('/operator/(tabs)/profile');
      },
    },
    {
      renderIcon: (color) => <Ionicons name="wallet-outline" size={24} color={color} />,
      label: 'Earnings',
      onPress: () => {
        onClose();
        router.push('/operator/(tabs)/earnings');
      },
    },
    {
      renderIcon: (color) => <Ionicons name="time-outline" size={24} color={color} />,
      label: 'Trip History',
      onPress: () => {
        onClose();
        router.push('/operator/(tabs)/profile');
      },
    },
    {
      renderIcon: (color) => <Ionicons name="settings-outline" size={24} color={color} />,
      label: 'Settings',
      onPress: () => {
        onClose();
        showToast('Settings screen coming soon', 'info');
      },
    },
    {
      renderIcon: (color) => <Ionicons name="log-out-outline" size={24} color={color} />,
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
              {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.menuItem,
                      { borderBottomColor: borderColor },
                      index === menuItems.length - 1 && styles.lastMenuItem,
                    ]}
                    onPress={item.onPress}
                  >
                    {item.renderIcon(item.destructive ? '#EF4444' : iconColor)}
                    <ThemedText
                      style={[
                        styles.menuItemText,
                        item.destructive && { color: '#EF4444' },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
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

