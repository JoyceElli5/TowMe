import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, signOut } from '@/lib/services/authService';
import { getUserVehicles, UserVehicle } from '@/lib/services/vehicleService';

// Note: I might need to bridge valid profile logic or fetch profile using supabase directly 
// if I don't migrate profileService to lib/services yet.
// Since User gave specific instructions for Auth/Pricing/Vehicles, I will assume profileService 
// can be used or I should just fetch profile in here with Supabase direct call or move profileService.
// I will stick to what exists but adapt imports.

export default function ProfileScreen() {
  // Use theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const { showToast } = useToast();
  // We'll store basic user info or full profile
  const [userProfile, setUserProfile] = useState<any>(null);
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace('/screens/auth/phone-login-screen');
        return;
      }

      // Fetch profile (assuming we can just query the table)
      // Or use previous service if available. I'll just keep it simple.
      // Ideally I create client/lib/services/userService.ts but I will do it inline or rely on existing.
      const { data: profile } = await import('@/lib/supabase').then(m =>
        m.supabase.from('profiles').select('*').eq('id', user.id).single()
      );
      setUserProfile(profile);

      setIsLoadingVehicles(true);
      const userVehicles = await getUserVehicles(user.id);
      setVehicles(userVehicles);
      setIsLoadingVehicles(false);

    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
      setIsLoadingVehicles(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/screens/auth/phone-login-screen');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#003554" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.profileHeader, { backgroundColor }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.full_name ? userProfile.full_name[0].toUpperCase() : 'U'}
              </Text>
            </View>
          </View>
          <ThemedText style={styles.userName}>{userProfile?.full_name || 'User'}</ThemedText>
          <ThemedText style={styles.userPhone}>{userProfile?.phone || ''}</ThemedText>
        </View>

        {/* Vehicles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>My Vehicles</ThemedText>
            <TouchableOpacity onPress={() => router.push('/screens/user/add-edit-vehicle-screen')}>
              <Text style={styles.addText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {isLoadingVehicles ? (
            <ActivityIndicator />
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No vehicles added yet</Text>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.vehicleCard}
                onPress={() => router.push({
                  pathname: '/screens/user/add-edit-vehicle-screen',
                  params: { vehicleId: vehicle.id }
                })}
              >
                {vehicle.photo_url ? (
                  <Image source={{ uri: vehicle.photo_url }} style={styles.vehicleImage} />
                ) : (
                  <View style={styles.vehiclePlaceholder}>
                    <Ionicons name="car-sport" size={24} color="#9ca3af" />
                  </View>
                )}
                <View style={styles.vehicleInfo}>
                  <ThemedText style={styles.vehicleName}>
                    {vehicle.make} {vehicle.model}
                  </ThemedText>
                  <Text style={styles.vehiclePlate}>{vehicle.plate_number}</Text>
                </View>
                <View style={styles.vehicleTypeTag}>
                  <Text style={styles.vehicleTypeText}>{vehicle.vehicle_type}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Settings / Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#003554',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '700',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  userPhone: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addText: {
    color: '#003554',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#fff', // Ideally use themed background but sticking to quick styling
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#9ca3af',
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  vehicleImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  vehiclePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#6b7280',
  },
  vehicleTypeTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vehicleTypeText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
