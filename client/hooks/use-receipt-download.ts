/**
 * Custom hook for downloading and sharing receipts
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert } from 'react-native';

import { useToast } from './use-toast';
import { downloadReceipt } from '@/lib/api';

export function useReceiptDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useToast();

  const handleDownloadReceipt = async (requestId: string) => {
    if (!requestId) {
      showToast('Request ID not found', 'error');
      return;
    }

    // Sanitize requestId to prevent directory traversal
    const sanitizedRequestId = requestId.replace(/[^a-zA-Z0-9-]/g, '');
    if (!sanitizedRequestId || sanitizedRequestId !== requestId) {
      showToast('Invalid request ID', 'error');
      return;
    }

    setIsDownloading(true);
    try {
      const receiptText = await downloadReceipt(requestId);
      
      // Save to file system with sanitized ID
      const fileUri = `${FileSystem.documentDirectory}receipt-${sanitizedRequestId}.txt`;
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

  return {
    isDownloading,
    handleDownloadReceipt,
  };
}
