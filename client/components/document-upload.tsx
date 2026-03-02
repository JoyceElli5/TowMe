import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';

export interface DocumentUploadProps {
    label: string;
    value: string | null;
    onUpload: (uri: string) => Promise<void>;
    onRemove?: () => void;
    documentType: 'ghana_card' | 'drivers_license' | 'operator_photo' | 'vehicle_registration' | 'insurance';
    allowCamera?: boolean;
    isUploading?: boolean;
}

export function DocumentUpload({
    label,
    value,
    onUpload,
    onRemove,
    documentType,
    allowCamera = true,
    isUploading = false,
}: DocumentUploadProps) {
    const { showToast } = useToast();
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
    const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

    const styles = StyleSheet.create({
        documentSection: {
            marginBottom: 16,
        },
        documentLabel: {
            fontSize: 14,
            fontFamily: Fonts.medium,
            marginBottom: 8,
        },
        documentPreview: {
            marginTop: 8,
            position: 'relative',
        },
        documentImage: {
            width: '100%',
            height: 200,
            borderRadius: 12,
            marginBottom: 8,
        },
        uploadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        uploadingText: {
            color: '#fff',
            marginTop: 8,
            fontSize: 14,
            fontFamily: Fonts.medium,
        },
        uploadButtons: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 8,
        },
        uploadButton: {
            flex: 1,
            height: 48,
            borderWidth: 1.5,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
        uploadButtonText: {
            fontSize: 14,
            fontFamily: Fonts.medium,
            color: '#fff',
        },
        removeButton: {
            height: 40,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 16,
        },
        removeButtonText: {
            color: '#fff',
            fontSize: 14,
            fontFamily: Fonts.medium,
        },
    });

    const handlePickImage = async (useCamera: boolean) => {
        try {
            // Request permissions
            let permissionStatus;
            if (useCamera) {
                permissionStatus = await ImagePicker.requestCameraPermissionsAsync();
                if (permissionStatus.status !== 'granted') {
                    showToast('Camera permission is required to take photos', 'error');
                    return;
                }
            } else {
                permissionStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionStatus.status !== 'granted') {
                    showToast('Permission to access photos is required', 'error');
                    return;
                }
            }

            // Launch image picker
            const pickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3] as [number, number],
                quality: 0.8,
            };

            const result = useCamera
                ? await ImagePicker.launchCameraAsync(pickerOptions)
                : await ImagePicker.launchImageLibraryAsync(pickerOptions);

            // Check result
            if (result.canceled) {
                // User cancelled, don't show error
                return;
            }

            if (!result.assets || result.assets.length === 0) {
                showToast('No image was selected', 'error');
                return;
            }

            const selectedImage = result.assets[0];
            if (!selectedImage.uri) {
                showToast('Invalid image selected', 'error');
                return;
            }

            // Upload the image
            await onUpload(selectedImage.uri);
        } catch (error: any) {
            console.error('Image picker error:', error);
            const errorMessage = error?.message || error?.toString() || 'Failed to pick image';
            showToast(`Error: ${errorMessage}`, 'error');
        }
    };

    return (
        <View style={styles.documentSection}>
            <ThemedText style={styles.documentLabel}>{label}</ThemedText>
            {value ? (
                <View style={styles.documentPreview}>
                    <Image source={{ uri: value }} style={styles.documentImage} />
                    {isUploading && (
                        <View style={styles.uploadingOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                            <ThemedText style={styles.uploadingText}>Uploading...</ThemedText>
                        </View>
                    )}
                    {!isUploading && (
                        <TouchableOpacity
                            style={[styles.removeButton, { backgroundColor: '#ef4444' }]}
                            onPress={onRemove}
                        >
                            <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View style={styles.uploadButtons}>
                    {allowCamera && (
                        <TouchableOpacity
                            style={[styles.uploadButton, { borderColor, backgroundColor: buttonColor }]}
                            onPress={() => handlePickImage(true)}
                        >
                            <Ionicons name="camera-outline" size={20} color="#fff" />
                            <ThemedText style={styles.uploadButtonText}>Take Photo</ThemedText>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.uploadButton, { borderColor }]}
                        onPress={() => handlePickImage(false)}
                    >
                        <Ionicons name="image-outline" size={20} color={buttonColor} />
                        <ThemedText style={[styles.uploadButtonText, { color: buttonColor }]}>
                            Choose from Gallery
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
