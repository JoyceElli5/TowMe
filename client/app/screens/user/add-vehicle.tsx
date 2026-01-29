import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { vehicleService, VehicleType } from '@/services/vehicles';

export default function AddVehicleScreen() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        vehicle_type: 'car' as VehicleType,
        make: '',
        model: '',
        color: '',
        plate_number: '',
    });

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!formData.make || !formData.model || !formData.plate_number) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            let photoUrl = null;
            if (photoUri) {
                photoUrl = await vehicleService.uploadVehiclePhoto(user.id, photoUri);
            }

            await vehicleService.addVehicle({
                user_id: user.id,
                vehicle_type: formData.vehicle_type,
                make: formData.make,
                model: formData.model,
                color: formData.color,
                plate_number: formData.plate_number,
                photo_url: photoUrl,
            });

            showToast('Vehicle added successfully', 'success');
            router.back();
        } catch (error) {
            console.error(error);
            showToast('Failed to add vehicle', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Add Vehicle</Text>
                    </View>

                    <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.vehicleImage} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="camera-outline" size={32} color="#6b7280" />
                                <Text style={styles.placeholderText}>Add Vehicle Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.form}>
                        <Text style={styles.label}>Vehicle Type</Text>
                        <View style={styles.typeSelector}>
                            {(['car', 'suv', 'saloon', 'van'] as VehicleType[]).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeOption,
                                        formData.vehicle_type === type && styles.selectedType,
                                    ]}
                                    onPress={() => setFormData({ ...formData, vehicle_type: type })}
                                >
                                    <Text
                                        style={[
                                            styles.typeText,
                                            formData.vehicle_type === type && styles.selectedTypeText,
                                        ]}
                                    >
                                        {type.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Make</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Toyota"
                                value={formData.make}
                                onChangeText={(text) => setFormData({ ...formData, make: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Model</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Corolla"
                                value={formData.model}
                                onChangeText={(text) => setFormData({ ...formData, model: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Color</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Silver"
                                value={formData.color}
                                onChangeText={(text) => setFormData({ ...formData, color: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Plate Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="GR-123-24"
                                value={formData.plate_number}
                                onChangeText={(text) => setFormData({ ...formData, plate_number: text })}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Add Vehicle</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    imagePicker: {
        height: 160,
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: '#6b7280',
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    typeOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    selectedType: {
        backgroundColor: '#003554',
        borderColor: '#003554',
    },
    typeText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
    },
    selectedTypeText: {
        color: '#fff',
    },
    inputGroup: {
        marginBottom: 4,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
    },
    submitButton: {
        height: 56,
        backgroundColor: '#003554',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
