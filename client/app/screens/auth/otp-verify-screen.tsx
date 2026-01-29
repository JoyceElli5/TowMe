import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useToast } from '@/hooks/use-toast';
import { OtpVerifyFormData, otpVerifySchema, UserRole } from '@/schemas/auth';
import { authService } from '@/services/auth';

export default function OtpVerifyScreen() {
    const params = useLocalSearchParams<{ phone: string; role: UserRole }>();
    const phone = params.phone ?? '';
    const role = params.role ?? 'vehicle_owner';

    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<OtpVerifyFormData>({
        resolver: zodResolver(otpVerifySchema),
        defaultValues: {
            otp: '',
        },
    });

    const onSubmit = async (data: OtpVerifyFormData) => {
        setIsLoading(true);
        try {
            const result = await authService.verifyOtp(phone, data.otp);

            console.log('Verification successful:', result);
            showToast('Login successful!', 'success');

            // Navigate to appropriate dashboard
            setTimeout(() => {
                if (role === 'tow_operator') {
                    router.replace('/screens/operator/dashboard');
                } else {
                    router.replace('/(tabs)');
                }
            }, 500);
        } catch (error) {
            console.error('Verification error:', error);
            showToast('Invalid code. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackPress = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackPress}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <Ionicons name="arrow-back" size={22} color="#111827" />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Verify Phone</Text>
                        <Text style={styles.subtitle}>
                            Enter the 6-digit code sent to {phone}
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* OTP Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Verification Code</Text>
                            <Controller
                                control={control}
                                name="otp"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={[styles.input, errors.otp && styles.inputError]}
                                        placeholder="123456"
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        autoCapitalize="none"
                                        autoComplete="sms-otp"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        accessibilityLabel="OTP input"
                                    />
                                )}
                            />
                            {errors.otp && (
                                <Text style={styles.errorText}>{errors.otp.message}</Text>
                            )}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isLoading}
                            accessibilityLabel="Verify Code"
                            accessibilityRole="button"
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={[styles.loginButtonText, { marginLeft: 12 }]}>Verifying...</Text>
                                </View>
                            ) : (
                                <Text style={styles.loginButtonText}>Verify Code</Text>
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
        backgroundColor: '#ffffff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f9fafb',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Gilroy-SemiBold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Gilroy-Regular',
        color: '#6b7280',
        lineHeight: 24,
    },
    form: {
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Gilroy-Medium',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 28,
        paddingHorizontal: 20,
        fontSize: 24,
        color: '#111827',
        backgroundColor: '#ffffff',
        fontFamily: 'Gilroy-SemiBold',
        textAlign: 'center',
        letterSpacing: 8,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 13,
        fontFamily: 'Gilroy-Regular',
        marginTop: 6,
    },
    loginButton: {
        height: 56,
        backgroundColor: '#003554',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#003554',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Gilroy-SemiBold',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
