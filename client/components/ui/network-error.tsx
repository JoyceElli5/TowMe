import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import PrimaryButton from '../primary-button';
import { ThemedText } from '../themed-text';

interface NetworkErrorProps {
    onRetry: () => void;
    isLoading?: boolean;
}

export function NetworkError({ onRetry, isLoading = false }: NetworkErrorProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="wifi-outline" size={48} color="#EF4444" />
            </View>
            <ThemedText type="subtitle" style={styles.title}>
                Connection Error
            </ThemedText>
            <ThemedText style={styles.description}>
                We're having trouble reaching our servers. Please check your internet connection and try again.
            </ThemedText>
            <View style={styles.actionContainer}>
                <PrimaryButton
                    label="Try Again"
                    onPress={onRetry}
                    isLoading={isLoading}
                    variant="primary"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        backgroundColor: 'transparent',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    description: {
        textAlign: 'center',
        opacity: 0.6,
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    actionContainer: {
        width: '100%',
        maxWidth: 200,
    },
});
