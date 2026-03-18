/**
 * Operator Profile Screen
 *
 * Shows operator profile information, earnings, and settings.
 * Redesigned with Gilroy fonts, proper spacing, and fixed logout padding.
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, logout } from '@/lib/api';
import { getOperatorRequests } from '@/lib/api/requests';
import { getOperatorProfile } from '@/lib/services/operatorService';

export default function OperatorProfileScreen() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({ light: '#f9fafb', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
  const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
  const subtitleColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'text');

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.replace('/screens/auth/login-screen');
        return;
      }
      setUser(currentUser);

      const [operatorProfile, trips] = await Promise.all([
        getOperatorProfile(currentUser.id),
        getOperatorRequests(currentUser.id, { status: 'completed', limit: 50 }),
      ]);

      setProfile(operatorProfile);

      if (trips) {
        setTotalTrips(trips.length);
        const total = trips.reduce((sum: number, trip: any) =>
          sum + (trip.finalPrice || trip.estimatedPrice || 0), 0);
        setEarnings(total);
      }
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/screens/auth/login-screen');
          } catch {
            showToast('Failed to log out', 'error');
          }
        },
      },
    ]);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'OP';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const rating = profile?.average_rating ?? user?.averageRating ?? null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {getInitials(user?.fullName || profile?.full_name)}
            </Text>
          </View>
          <Text style={styles.heroName}>{user?.fullName || profile?.full_name || 'Operator'}</Text>
          <Text style={[styles.heroSub, { color: subtitleColor }]}>
            {user?.phone || profile?.phone || 'Tow Operator'}
          </Text>
          {rating !== null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="cash-outline" size={22} color={tintColor} />
            <Text style={[styles.statValue, { color: tintColor }]}>GH₵ {earnings.toFixed(0)}</Text>
            <Text style={[styles.statLabel, { color: subtitleColor }]}>Earnings</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={tintColor} />
            <Text style={[styles.statValue, { color: tintColor }]}>{totalTrips}</Text>
            <Text style={[styles.statLabel, { color: subtitleColor }]}>Trips Done</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="star-outline" size={22} color={tintColor} />
            <Text style={[styles.statValue, { color: tintColor }]}>
              {rating !== null ? Number(rating).toFixed(1) : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: subtitleColor }]}>Rating</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionLabel, { color: subtitleColor }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            tintColor={tintColor}
            borderColor={borderColor}
            onPress={() => router.push('/screens/operator/profile-setup-screen')}
          />
          <MenuItem
            icon="document-text-outline"
            label="My Documents"
            tintColor={tintColor}
            borderColor={borderColor}
            onPress={() => showToast('Coming soon', 'info')}
            isLast
          />
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: subtitleColor }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.menuItem, { borderBottomColor: borderColor }]}>
            <View style={[styles.menuIconBox, { backgroundColor: `${tintColor}18` }]}>
              <Ionicons name={theme === 'dark' ? 'moon-outline' : 'sunny-outline'} size={18} color={tintColor} />
            </View>
            <Text style={[styles.menuLabel, { color: tintColor === '#003554' ? '#111827' : '#f9fafb' }]}>Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
              thumbColor={theme === 'dark' ? '#3b82f6' : '#f9fafb'}
            />
          </View>
        </View>

        {/* Support */}
        <Text style={[styles.sectionLabel, { color: subtitleColor }]}>SUPPORT</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & FAQs"
            tintColor={tintColor}
            borderColor={borderColor}
            onPress={() => showToast('Coming soon', 'info')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Terms & Conditions"
            tintColor={tintColor}
            borderColor={borderColor}
            onPress={() => showToast('Coming soon', 'info')}
            isLast
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>TowMe v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  tintColor,
  borderColor,
  onPress,
  isLast = false,
}: {
  icon: any;
  label: string;
  tintColor: string;
  borderColor: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const textColor = useThemeColor({ light: '#111827', dark: '#f9fafb' }, 'text');
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && { borderBottomColor: borderColor, borderBottomWidth: 1 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, { backgroundColor: `${tintColor}18` }]}>
        <Ionicons name={icon} size={18} color={tintColor} />
      </View>
      <Text style={[styles.menuLabel, { color: textColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Gilroy-Bold',
    color: '#ffffff',
  },
  heroName: {
    fontSize: 24,
    fontFamily: 'Gilroy-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: 'Gilroy-Regular',
    marginBottom: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Gilroy-SemiBold',
    color: '#92400e',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Gilroy-Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Gilroy-Regular',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Gilroy-SemiBold',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Gilroy-Medium',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: '#ef4444',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: '#9ca3af',
    marginTop: 4,
  },
});
