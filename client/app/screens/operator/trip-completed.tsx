/**
 * Trip Completed (Operator) Screen
 * 
 * Shows trip completion summary for operator.
 * Displays earnings and prompts for user rating.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRequestById, type TowingRequest } from '@/lib/api';

export default function TripCompletedOperatorScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!params.requestId) {
        Alert.alert('Error', 'Request ID is missing');
        router.back();
        return;
      }

      try {
        const requestData = await getRequestById(params.requestId);
        setRequest(requestData);
      } catch (error) {
        console.error('Failed to fetch request:', error);
        Alert.alert('Error', 'Failed to load trip details');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [params.requestId]);

  const handleRate = () => {
    if (params.requestId) {
      router.push({
        pathname: '/screens/operator/rate-user',
        params: { requestId: params.requestId },
      });
    }
  };

  const handleDone = () => {
    router.replace('/screens/operator/dashboard');
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

  // Calculate duration in minutes
  const getDuration = () => {
    if (!request.startedAt || !request.completedAt) return 'N/A';
    const start = new Date(request.startedAt).getTime();
    const end = new Date(request.completedAt).getTime();
    const minutes = Math.round((end - start) / 60000);
    return `${minutes} min`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.checkIcon}>💰</Text>
        </View>

        <Text style={styles.title}>Trip Completed!</Text>
        <Text style={styles.subtitle}>
          Great job! You&apos;ve successfully completed this towing service.
        </Text>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsValue}>GH₵ {(request.finalPrice || request.estimatedPrice).toFixed(2)}</Text>
          <Text style={styles.earningsNote}>Will be added to your balance</Text>
        </View>

        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer</Text>
            <Text style={styles.summaryValue}>{request.user?.fullName || 'Unknown User'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>{request.distanceKm?.toFixed(1) || '0.0'} km</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{getDuration()}</Text>
          </View>
        </View>

        {/* Download Receipt Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownloadReceipt(requestId)}
          disabled={isDownloading}
          activeOpacity={0.8}
        >
          {isDownloading ? (
            <ActivityIndicator color="#003554" size="small" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#003554" />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Rate Button */}
        <TouchableOpacity
          style={styles.rateButton}
          onPress={handleRate}
          activeOpacity={0.8}
        >
          <Text style={styles.rateButtonText}>Rate Customer</Text>
        </TouchableOpacity>

        {/* Done Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.7}
        >
          <Text style={styles.doneButtonText}>Back to Dashboard</Text>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkIcon: {
    fontSize: 48,
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
  earningsCard: {
    width: '100%',
    backgroundColor: '#003554',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#bae6fd',
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  earningsNote: {
    fontSize: 12,
    color: '#93c5fd',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  downloadButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#003554',
    flexDirection: 'row',
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003554',
  },
  rateButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#003554',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
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
