import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { sendOTP, verifyOTP } from '@/lib/services/authService';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OTPVerifyScreen() {
    const params = useLocalSearchParams<{ phone: string }>();
    // Ensure we handle array or string, though usually string if single param
    const phone = Array.isArray(params.phone) ? params.phone[0] : (params.phone || '');

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const { showToast } = useToast();
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
    const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste if needed, but for now just take last char
            value = value[value.length - 1];
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            showToast('Please enter the complete 6-digit code', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await verifyOTP(phone, code);
            if (result.success) {
                showToast('Login successful!', 'success');
                router.replace('/(tabs)');
            } else {
                showToast(result.error || 'Invalid OTP code', 'error');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error: any) {
            showToast(error.message || 'An error occurred', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        try {
            const result = await sendOTP(phone);
            if (result.success) {
                showToast('OTP resent successfully!', 'success');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                showToast(result.error || 'Failed to resend OTP', 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'An error occurred', 'error');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <ThemedText style={styles.title}>Enter Verification Code</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        We sent a 6-digit code to {phone}
                    </ThemedText>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    { borderColor, color: textColor },
                                    digit ? { borderColor: buttonColor } : undefined,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            { backgroundColor: buttonColor },
                            otp.join('').length !== 6 && styles.buttonDisabled,
                        ]}
                        onPress={handleVerify}
                        disabled={isLoading || otp.join('').length !== 6}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>Verify</ThemedText>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleResend}
                        disabled={isResending}
                    >
                        {isResending ? (
                            <ActivityIndicator size="small" />
                        ) : (
                            <ThemedText style={styles.resendText}>Resend Code</ThemedText>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
        opacity: 0.7,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 12,
    },
    otpInput: {
        flex: 1,
        height: 64,
        borderWidth: 2,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
    },
    button: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    resendButton: {
        alignItems: 'center',
        padding: 16,
    },
    resendText: {
        fontSize: 14,
        opacity: 0.7,
    },
});
