/**
 * TripCompleted Screen (Placeholder)
 * 
 * Displayed when the towing service is complete.
 * Shows trip summary and prompts for rating.
 */

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
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

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { ApiError, getAccessToken, getRequestById, type TowingRequest } from '@/lib/api';
import { API_BASE_URL } from '@/lib/api/client';

export default function TripCompletedScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId || '';
  const [isDownloading, setIsDownloading] = useState(false);
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    if (requestId) {
      loadRequest();
    } else {
      showToast('Request ID not found', 'error');
      router.back();
    }
  }, [requestId]);

  const loadRequest = async () => {
    if (!requestId) return;

    try {
      setIsLoading(true);
      const data = await getRequestById(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to load trip details', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = () => {
    if (requestId) {
      router.push({
        pathname: '/screens/user/rating',
        params: { requestId },
      });
    }
  };

  const handleHome = () => {
    router.replace('/screens/user/home-screen');
  };

  const handleDownloadReceipt = async () => {
    if (!requestId) {
      showToast('Request ID not found', 'error');
      return;
    }

    setIsDownloading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/receipt`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const receiptText = await response.text();
      
      // Save to file system
      const fileUri = `${FileSystem.documentDirectory}receipt-${requestId}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, receiptText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Save Receipt',
        });
        showToast('Receipt downloaded successfully', 'success');
      } else {
        Alert.alert('Receipt Saved', `Receipt saved to: ${fileUri}`);
        showToast('Receipt saved to device', 'success');
      }
    } catch (error) {
      console.error('Receipt download error:', error);
      showToast('Failed to download receipt', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003554" />
          <ThemedText style={styles.loadingText}>Loading trip details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.errorText}>Trip information not available</ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate duration if we have start and completion times
  const getDuration = () => {
    if (request.startedAt && request.completedAt) {
      const start = new Date(request.startedAt).getTime();
      const end = new Date(request.completedAt).getTime();
      const minutes = Math.floor((end - start) / 60000);
      return `${minutes} min`;
    }
    // Fallback estimate based on distance
    return `~${Math.ceil((request.distanceKm || 0) * 2)} min`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
        </View>

        <ThemedText style={styles.title}>Trip Completed!</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your vehicle has been successfully towed to the destination
        </ThemedText>

        {/* Trip Summary Card */}
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryTitle}>Trip Summary</ThemedText>

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>From</ThemedText>
            <ThemedText style={styles.summaryValue}>{request.pickupAddress}</ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>To</ThemedText>
            <ThemedText style={styles.summaryValue}>{request.destinationAddress}</ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Distance</ThemedText>
            <ThemedText style={styles.summaryValue}>{request.distanceKm?.toFixed(1) || '0'} km</ThemedText>
          </View>

          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Duration</ThemedText>
            <ThemedText style={styles.summaryValue}>{getDuration()}</ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
            <ThemedText style={styles.totalValue}>
              GH₵ {(request.finalPrice || request.estimatedPrice || 0).toFixed(2)}
            </ThemedText>
          </View>
        </View>

        {/* Download Receipt Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownloadReceipt()}
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
          <Text style={styles.rateButtonText}>Rate Your Experience</Text>
        </TouchableOpacity>

        {/* Home Button */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHome}
          activeOpacity={0.7}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
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
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  summaryCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#003554',
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
  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#003554',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
