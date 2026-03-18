/**
 * Arrived at Pickup Screen
 * 
 * Displayed when operator arrives at pickup location.
 * Allows operator to confirm vehicle loading and start towing.
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { operatorSafeBack } from '@/lib/navigation';
import { CheckmarkCircle01Icon } from 'hugeicons-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/hooks/use-toast';
import { getRequestById, type TowingRequest } from '@/lib/api';

const formatVehicleType = (vehicleType?: string): string => {
  if (!vehicleType) return 'Unknown';
  return vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);
};

export default function ArrivedAtPickupScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const { showToast } = useToast();

  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!params.requestId) {
        Alert.alert('Error', 'Request ID is missing');
        operatorSafeBack();
        return;
      }

      try {
        const requestData = await getRequestById(params.requestId);
        setRequest(requestData);
      } catch (error) {
        console.error('Failed to fetch request:', error);
        Alert.alert('Error', 'Failed to load request details');
        operatorSafeBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [params.requestId]);

  const handleStartTowing = () => {
    if (params.requestId) {
      router.replace({
        pathname: '/screens/operator/towing-in-progress',
        params: { requestId: params.requestId },
      });
    }
  };

  const handleCall = () => {
    if (request?.user?.phone) {
      Linking.openURL(`tel:${request.user.phone}`);
    }
  };

  const handleMessage = () => {
    if (params.requestId) {
      router.push({
        pathname: '/screens/operator/chat-screen',
        params: { requestId: params.requestId },
      });
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading || !request) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <CheckmarkCircle01Icon size={64} color="#10B981" strokeWidth={2} />
        </View>

        <Text style={styles.title}>You&apos;ve Arrived!</Text>
        <Text style={styles.subtitle}>
          Meet the customer and load the vehicle onto your tow truck
        </Text>

        {/* Customer Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>{getUserInitials(request.user?.fullName)}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{request.user?.fullName || 'Unknown User'}</Text>
            <Text style={styles.vehicleInfo}>{formatVehicleType(request.vehicleType)}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.circularButton, { backgroundColor: '#bae6fd' }]} onPress={handleMessage}>
              <Ionicons name="chatbubble" size={20} color="#003554" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circularButton, { backgroundColor: '#dcfce7' }]} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.checklist}>
          <Text style={styles.checklistTitle}>Before Starting</Text>

          <View style={styles.checkItem}>
            <View style={styles.checkbox}>
              <CheckmarkCircle01Icon size={16} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.checkText}>Confirm vehicle identity</Text>
          </View>

          <View style={styles.checkItem}>
            <View style={styles.checkbox}>
              <CheckmarkCircle01Icon size={16} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.checkText}>Secure vehicle on tow truck</Text>
          </View>

          <View style={styles.checkItem}>
            <View style={styles.checkbox}>
              <CheckmarkCircle01Icon size={16} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.checkText}>Confirm destination with customer</Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartTowing}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Towing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkIcon: {
    fontSize: 40,
    color: '#22c55e',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  customerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003554',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  circularButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    fontSize: 20,
  },
  checklist: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '700',
  },
  checkText: {
    fontSize: 14,
    color: '#374151',
  },
  startButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 24,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});
