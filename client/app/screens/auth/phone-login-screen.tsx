import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useToast } from '@/hooks/use-toast';
import { sendOTP } from '@/lib/services/authService';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function PhoneLoginScreen() {
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
    const buttonColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');

    const handleSendOTP = async () => {
        if (!phone.trim()) {
            showToast('Please enter your phone number', 'error');
            return;
        }

        // Basic phone validation (Ghana format) 
        // Allowing +233 or 0 starter
        const phoneRegex = /^(0|\+233)[0-9]{9}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            showToast('Please enter a valid Ghana phone number', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const result = await sendOTP(phone);
            if (result.success) {
                showToast('OTP sent successfully!', 'success');
                router.push({
                    pathname: '/screens/auth/otp-verify-screen',
                    params: { phone },
                });
            } else {
                showToast(result.error || 'Failed to send OTP', 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'An error occurred', 'error');
        } finally {
            setIsLoading(false);
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
                    <ThemedText style={styles.title}>Welcome to TowMe</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Enter your phone number to get started
                    </ThemedText>

                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Phone Number</ThemedText>
                        <TextInput
                            style={[styles.input, { borderColor, color: textColor }]}
                            placeholder="024 123 4567"
                            placeholderTextColor="#9ca3af"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                            autoFocus
                        />
                        <ThemedText style={styles.hint}>
                            Enter your Ghana phone number (e.g., 0241234567)
                        </ThemedText>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: buttonColor }]}
                        onPress={handleSendOTP}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>Send OTP</ThemedText>
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
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    hint: {
        fontSize: 12,
        marginTop: 6,
        opacity: 0.6,
    },
    button: {
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});
