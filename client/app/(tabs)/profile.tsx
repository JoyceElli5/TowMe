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
import { 
  Camera01Icon, 
  Logout01Icon, 
  Moon01Icon, 
  Sun01Icon, 
  Notification01Icon, 
  Chatting01Icon, 
  Mail01Icon, 
  CreditCardIcon, 
  SmartPhone01Icon, 
  Wallet01Icon, 
  UserBlock01Icon, 
  HeadsetIcon, 
  HelpCircleIcon, 
  LegalDocument01Icon, 
  ArrowRight01Icon,
  Location01Icon
} from 'hugeicons-react-native';

import { useTheme } from '@/contexts/theme-context';
import { useToast } from '@/hooks/use-toast';
import { ApiError, getCurrentUser, logout, updateUserAvatar, type User } from '@/lib/api';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface SettingItemProps {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  title: string;
  subtitle?: string;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
}

function SettingItem({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  showArrow = true,
  showSwitch = false,
  switchValue = false,
  onPress,
  onSwitchChange,
}: SettingItemProps & { onSwitchChange?: (value: boolean) => void }) {
  const iconBgColor = useThemeColor({}, 'background');
  const arrowColor = useThemeColor({}, 'icon');
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View
        style={[styles.settingIcon, { backgroundColor: `${iconColor}15` }]}
      >
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
        {subtitle && <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>}
      </View>
      {showArrow && (
        <ArrowRight01Icon size={20} color={arrowColor} strokeWidth={2} />
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
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
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

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const statsBg = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');
  const dividerColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ThemedView style={styles.profileHeader}>
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
                <Camera01Icon size={16} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
          <ThemedText type="title" style={styles.userName}>
            {currentUser?.fullName || 'John Doe'}
          </ThemedText>
          <ThemedText style={styles.userEmail}>
            {currentUser?.email || 'john.doe@example.com'}
          </ThemedText>
          <ThemedView style={[styles.statsContainer, { backgroundColor: statsBg }]}>
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {currentUser?.averageRating?.toFixed(1) || '0.0'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Rating</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: dividerColor }]} />
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {currentUser?.totalTrips || 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Trips</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: dividerColor }]} />
            <View style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statValue}>
                {currentUser?.isVerified ? '✓' : '—'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Verified</ThemedText>
            </View>
          </ThemedView>
        </ThemedView>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon={theme === 'dark' ? Moon01Icon : Sun01Icon}
            iconColor={theme === 'dark' ? '#6366F1' : '#F59E0B'}
            title="Dark Mode"
            subtitle={theme === 'dark' ? 'Enabled - Tap to switch to Light Mode' : 'Disabled - Tap to switch to Dark Mode'}
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
            icon={Notification01Icon}
            iconColor="#3B82F6"
            title="Push Notifications"
            showArrow={false}
            showSwitch
            switchValue={true}
          />
          <SettingItem
            icon={Chatting01Icon}
            iconColor="#10B981"
            title="SMS Alerts"
            showArrow={false}
            showSwitch
            switchValue={true}
          />
          <SettingItem
            icon={Mail01Icon}
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
            icon={CreditCardIcon}
            iconColor="#8B5CF6"
            title="Bank Account"
            subtitle="•••• 4532"
          />
          <SettingItem
            icon={SmartPhone01Icon}
            iconColor="#EC4899"
            title="Mobile Money"
            subtitle="024 ••• ••89"
          />
          <SettingItem
            icon={Wallet01Icon}
            iconColor="#10B981"
            title="Default Withdrawal"
            subtitle="Mobile Money"
          />
        </View>

        {/* Privacy */}
        <SectionHeader title="Privacy" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon={Location01Icon}
            iconColor="#EF4444"
            title="Share Location"
            subtitle="Only when online"
            showArrow={false}
            showSwitch
            switchValue={true}
          />
          <SettingItem
            icon={UserBlock01Icon}
            iconColor="#6B7280"
            title="Blocked Users"
            subtitle="2 users blocked"
          />
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.settingsCard}>
          <SettingItem
            icon={HeadsetIcon}
            iconColor="#3B82F6"
            title="Contact Support"
          />
          <SettingItem
            icon={HelpCircleIcon}
            iconColor="#F59E0B"
            title="FAQs"
          />
          <SettingItem
            icon={LegalDocument01Icon}
            iconColor="#6B7280"
            title="Terms & Conditions"
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Logout01Icon size={20} color="#EF4444" strokeWidth={2} />
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
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
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
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
  },
  settingSubtitle: {
    fontSize: 13,
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
