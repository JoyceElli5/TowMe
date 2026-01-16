/**
 * Profile Screen
 *
 * Shows user details and settings including:
 * - User avatar and name
 * - Notification preferences
 * - Payment settings
 * - Privacy settings
 * - Support options
 * - Logout button
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/hooks/use-toast';
import { ApiError, getCurrentUser, logout, updateUserAvatar, type User } from '@/lib/api';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle?: string;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
}

function SettingItem({
  icon,
  iconColor,
  title,
  subtitle,
  showArrow = true,
  showSwitch = false,
  switchValue = false,
  onPress,
  onSwitchChange,
}: SettingItemProps & { onSwitchChange?: (value: boolean) => void }) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View
        style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
          thumbColor={switchValue ? '#3B82F6' : '#F9FAFB'}
        />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/screens/auth/login-screen');
              showToast('Logged out successfully', 'success');
            } catch (error) {
              console.error('Logout error:', error);
              if (error instanceof ApiError) {
                showToast(error.message || 'Failed to log out', 'error');
              } else {
                showToast('Failed to log out', 'error');
              }
            }
          },
        },
      ]
    );
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access camera roll is required', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const imageUri = result.assets[0].uri;
        
        // In a real app, you would upload the image to a storage service (e.g., Supabase Storage)
        // and get a URL back. For now, we'll use the local URI as a placeholder
        // TODO: Implement actual image upload to Supabase Storage or similar
        
        if (currentUser) {
          try {
            // For now, we'll just update with a placeholder URL
            // In production, upload to Supabase Storage first
            await updateUserAvatar(currentUser.id, imageUri);
            await loadUser();
            showToast('Profile picture updated', 'success');
          } catch (error) {
            console.error('Failed to update avatar:', error);
            if (error instanceof ApiError) {
              showToast(error.message || 'Failed to update profile picture', 'error');
            } else {
              showToast('Failed to update profile picture', 'error');
            }
          }
        }
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showToast('Failed to pick image', 'error');
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {currentUser?.avatarUrl ? (
              <Image
                source={{ uri: currentUser.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentUser ? getInitials(currentUser.fullName) : 'JD'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleImagePick}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>
            {currentUser?.fullName || 'John Doe'}
          </Text>
          <Text style={styles.userEmail}>
            {currentUser?.email || 'john.doe@example.com'}
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentUser?.averageRating?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentUser?.totalTrips || 0}
              </Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentUser?.isVerified ? '✓' : '—'}
              </Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon={theme === 'dark' ? 'moon' : 'sunny'}
            iconColor={theme === 'dark' ? '#6366F1' : '#F59E0B'}
            title="Dark Mode"
            subtitle={theme === 'dark' ? 'Enabled' : 'Disabled'}
            showArrow={false}
            showSwitch
            switchValue={theme === 'dark'}
            onSwitchChange={toggleTheme}
          />
        </View>

        {/* Notification Preferences */}
        <SectionHeader title="Notifications" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="notifications"
            iconColor="#3B82F6"
            title="Push Notifications"
            showArrow={false}
            showSwitch
            switchValue={true}
          />
          <SettingItem
            icon="chatbubble"
            iconColor="#10B981"
            title="SMS Alerts"
            showArrow={false}
            showSwitch
            switchValue={true}
          />
          <SettingItem
            icon="mail"
            iconColor="#F59E0B"
            title="Email Updates"
            showArrow={false}
            showSwitch
            switchValue={false}
          />
        </View>

        {/* Payment Settings */}
        <SectionHeader title="Payment" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="card"
            iconColor="#8B5CF6"
            title="Bank Account"
            subtitle="•••• 4532"
          />
          <SettingItem
            icon="phone-portrait"
            iconColor="#EC4899"
            title="Mobile Money"
            subtitle="024 ••• ••89"
          />
          <SettingItem
            icon="wallet"
            iconColor="#10B981"
            title="Default Withdrawal"
            subtitle="Mobile Money"
          />
        </View>

        {/* Privacy */}
        <SectionHeader title="Privacy" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="location"
            iconColor="#EF4444"
            title="Share Location"
            subtitle="Only when online"
            showArrow={false}
            showSwitch
            switchValue={true}
          />
          <SettingItem
            icon="ban"
            iconColor="#6B7280"
            title="Blocked Users"
            subtitle="2 users blocked"
          />
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon="headset"
            iconColor="#3B82F6"
            title="Contact Support"
          />
          <SettingItem
            icon="help-circle"
            iconColor="#F59E0B"
            title="FAQs"
          />
          <SettingItem
            icon="document-text"
            iconColor="#6B7280"
            title="Terms & Conditions"
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>TowMe v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
