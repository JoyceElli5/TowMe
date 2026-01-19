/**
 * Trip Completed (Operator) Screen (Placeholder)
 * 
 * Shows trip completion summary for operator.
 * Displays earnings and prompts for user rating.
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

export default function TripCompletedOperatorScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId || '';
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useToast();

  const handleRate = () => {
    router.push('/screens/operator/rate-user');
  };

  const handleDone = () => {
    router.replace('/screens/operator/dashboard');
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
          <Text style={styles.checkIcon}>💰</Text>
        </View>

        <Text style={styles.title}>Trip Completed!</Text>
        <Text style={styles.subtitle}>
          Great job! You&apos;ve successfully completed this towing service.
        </Text>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Your Earnings</Text>
          <Text style={styles.earningsValue}>GH₵ 150.00</Text>
          <Text style={styles.earningsNote}>Will be added to your balance</Text>
        </View>

        {/* Trip Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer</Text>
            <Text style={styles.summaryValue}>Sarah Kofi</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>10.2 km</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>25 min</Text>
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
});
