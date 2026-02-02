import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

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
}

export function DocumentUpload({
    label,
    value,
    onUpload,
    onRemove,
    documentType,
    allowCamera = true,
}: DocumentUploadProps) {
    const { showToast } = useToast();
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
    const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

    const handlePickImage = async (useCamera: boolean) => {
        try {
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    showToast('Camera permission is required', 'error');
                    return;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    showToast('Permission to access photos is required', 'error');
                    return;
                }
            }

            const result = useCamera
                ? await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });

            if (!result.canceled && result.assets[0]) {
                await onUpload(result.assets[0].uri);
            }
        } catch (error: any) {
            showToast('Failed to pick image', 'error');
        }
    };

    return (
        <View style={styles.documentSection}>
            <ThemedText style={styles.documentLabel}>{label}</ThemedText>
            {value ? (
                <View style={styles.documentPreview}>
                    <Image source={{ uri: value }} style={styles.documentImage} />
                    <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: '#ef4444' }]}
                        onPress={onRemove}
                    >
                        <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
                    </TouchableOpacity>
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
    },
    documentImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
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
