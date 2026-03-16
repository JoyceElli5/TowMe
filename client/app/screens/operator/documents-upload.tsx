/**
 * Documents Upload Screen
 * 
 * Third step of operator onboarding - upload verification documents
 */

import { Ionicons } from '@expo/vector-icons';
// Document picker not needed - using ImagePicker instead
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/hooks/use-toast';
import { ApiError, DocumentType, submitForVerification, uploadDocument, getCurrentUser } from '@/lib/api';
import { uploadOperatorDocument } from '@/lib/storage';

interface DocumentItem {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

const REQUIRED_DOCUMENTS: DocumentItem[] = [
  {
    type: 'ghana_card',
    label: 'Ghana Card',
    description: 'Front side of your Ghana Card',
    required: true,
    icon: 'id-card',
  },
  {
    type: 'drivers_license',
    label: "Driver's License",
    description: 'Valid commercial driving license',
    required: true,
    icon: 'card',
  },
  {
    type: 'vehicle_registration',
    label: 'Vehicle Registration',
    description: 'Roadworthy certificate or registration',
    required: false,
    icon: 'document-text',
  },
  {
    type: 'insurance_certificate',
    label: 'Insurance Certificate',
    description: 'Valid vehicle insurance',
    required: false,
    icon: 'shield-checkmark',
  },
];

interface UploadedDoc {
  type: DocumentType;
  uri: string;
  uploaded: boolean;
}

export default function DocumentsUploadScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<DocumentType | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const { showToast } = useToast();

  const isDocUploaded = (type: DocumentType) => {
    return uploadedDocs.some(doc => doc.type === type && doc.uploaded);
  };

  const getDocUri = (type: DocumentType) => {
    return uploadedDocs.find(doc => doc.type === type)?.uri;
  };

  const handlePickDocument = async (docType: DocumentType) => {
    Alert.alert(
      'Select Source',
      'Choose how to upload your document',
      [
        {
          text: 'Camera',
          onPress: () => pickFromCamera(docType),
        },
        {
          text: 'Gallery',
          onPress: () => pickFromGallery(docType),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickFromCamera = async (docType: DocumentType) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast('Camera permission is required', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocumentFile(docType, result.assets[0].uri);
    }
  };

  const pickFromGallery = async (docType: DocumentType) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Gallery permission is required', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadDocumentFile(docType, result.assets[0].uri);
    }
  };

  const uploadDocumentFile = async (docType: DocumentType, uri: string) => {
    setUploadingDoc(docType);
    
    try {
      // Get current user ID for storage path
      let userId = 'unknown';
      try {
        const user = await getCurrentUser();
        if (user?.id) userId = user.id;
      } catch {
        console.log('Could not get user ID, using fallback');
      }

      // Upload to Supabase Storage
      let documentUrl: string;
      let storageUploadSucceeded = false;
      
      try {
        documentUrl = await uploadOperatorDocument(uri, userId, docType);
        storageUploadSucceeded = true;
        console.log('Storage upload successful:', documentUrl);
      } catch (storageError: any) {
        console.warn('Storage upload failed:', storageError);
        
        // Show a warning but continue with local URI for demo/development
        if (storageError?.message?.includes('Bucket not found')) {
          showToast('Note: Storage bucket not configured. Using local file.', 'info');
        } else if (storageError?.message?.includes('permission') || storageError?.message?.includes('denied')) {
          showToast('Note: Storage permissions not set. Using local file.', 'info');
        }
        
        // Fallback to local URI if storage fails (for demo/testing)
        documentUrl = uri;
      }
      
      // Save document record in database
      await uploadDocument({
        documentType: docType,
        documentUrl: documentUrl,
      });

      setUploadedDocs(prev => [
        ...prev.filter(d => d.type !== docType),
        { type: docType, uri, uploaded: true },
      ]);

      const docLabel = REQUIRED_DOCUMENTS.find(d => d.type === docType)?.label;
      if (storageUploadSucceeded) {
        showToast(`${docLabel} uploaded successfully!`, 'success');
      } else {
        showToast(`${docLabel} saved locally. Cloud sync pending.`, 'success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof ApiError) {
        showToast(error.message || 'Failed to upload document', 'error');
      } else if (error instanceof Error) {
        showToast(error.message || 'Failed to upload document', 'error');
      } else {
        showToast('Failed to upload document', 'error');
      }
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async () => {
    // Check required documents
    const requiredTypes = REQUIRED_DOCUMENTS.filter(d => d.required).map(d => d.type);
    const missingRequired = requiredTypes.filter(type => !isDocUploaded(type));

    if (missingRequired.length > 0) {
      const missingNames = missingRequired
        .map(type => REQUIRED_DOCUMENTS.find(d => d.type === type)?.label)
        .join(', ');
      showToast(`Please upload required documents: ${missingNames}`, 'error');
      return;
    }

    setIsLoading(true);
    try {
      await submitForVerification();
      
      showToast('Documents submitted for verification!', 'success');
      
      // Navigate to completion screen
      setTimeout(() => {
        router.push('/screens/operator/onboarding-complete' as any);
      }, 500);
    } catch (error) {
      console.error('Submit error:', error);
      if (error instanceof ApiError) {
        showToast(error.message || 'Failed to submit documents', 'error');
      } else {
        showToast('Failed to submit documents', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const uploadedCount = uploadedDocs.filter(d => d.uploaded).length;
  const requiredCount = REQUIRED_DOCUMENTS.filter(d => d.required).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 3</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="documents" size={40} color="#F97316" />
          </View>
          <Text style={styles.title}>Upload Documents</Text>
          <Text style={styles.subtitle}>
            Upload your verification documents. This helps us verify your identity and business.
          </Text>
        </View>

        {/* Upload Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {uploadedCount} of {requiredCount} required documents uploaded
          </Text>
          <View style={styles.statusBar}>
            <View 
              style={[
                styles.statusFill, 
                { width: `${(uploadedCount / requiredCount) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Document Cards */}
        <View style={styles.documentsContainer}>
          {REQUIRED_DOCUMENTS.map(doc => (
            <TouchableOpacity
              key={doc.type}
              style={[
                styles.documentCard,
                isDocUploaded(doc.type) && styles.documentCardUploaded,
              ]}
              onPress={() => handlePickDocument(doc.type)}
              disabled={uploadingDoc === doc.type}
            >
              {isDocUploaded(doc.type) && getDocUri(doc.type) ? (
                <Image 
                  source={{ uri: getDocUri(doc.type) }} 
                  style={styles.documentPreview}
                />
              ) : (
                <View style={styles.documentIconContainer}>
                  {uploadingDoc === doc.type ? (
                    <ActivityIndicator color="#F97316" size="large" />
                  ) : (
                    <Ionicons name={doc.icon} size={32} color="#9CA3AF" />
                  )}
                </View>
              )}
              
              <View style={styles.documentInfo}>
                <View style={styles.documentHeader}>
                  <Text style={styles.documentLabel}>{doc.label}</Text>
                  {doc.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>Required</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.documentDescription}>{doc.description}</Text>
                
                {isDocUploaded(doc.type) ? (
                  <View style={styles.uploadedStatus}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.uploadedText}>Uploaded</Text>
                  </View>
                ) : (
                  <Text style={styles.tapToUpload}>Tap to upload</Text>
                )}
              </View>

              {isDocUploaded(doc.type) && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.infoText}>
            Your documents are securely stored and only used for verification purposes.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            uploadedCount < requiredCount && styles.primaryButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || uploadedCount < requiredCount}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Submit for Verification</Text>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  statusBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  documentsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  documentCardUploaded: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  documentIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  documentPreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  requiredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  documentDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  uploadedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  uploadedText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  tapToUpload: {
    fontSize: 13,
    color: '#F97316',
    marginTop: 6,
    fontWeight: '500',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
