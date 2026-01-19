/**
 * TripCompleted Screen (Placeholder)
 * 
 * Displayed when the towing service is complete.
 * Shows trip summary and prompts for rating.
 */

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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

import { useToast } from '@/hooks/use-toast';
import { downloadReceipt } from '@/lib/api';

export default function TripCompletedScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId || '';
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useToast();

  const handleRate = () => {
    router.push('/screens/user/rating');
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
      const receiptText = await downloadReceipt(requestId);
      
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.checkIcon}>🎉</Text>
        </View>

        <Text style={styles.title}>Trip Completed!</Text>
        <Text style={styles.subtitle}>
          Your vehicle has been successfully towed to the destination
        </Text>

        {/* Trip Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Trip Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>From</Text>
            <Text style={styles.summaryValue}>Ring Road Central, Accra</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>To</Text>
            <Text style={styles.summaryValue}>Accra Mall, Accra</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>10.2 km</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>25 min</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>GH₵ 150.00</Text>
          </View>
        </View>

        {/* Download Receipt Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownloadReceipt}
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
});
