import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import PrimaryButton from '../primary-button';
import { ThemedText } from '../themed-text';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={Icon} size={64} color="#94A3B8" />
            </View>
            <ThemedText type="subtitle" style={styles.title}>
                {title}
            </ThemedText>
            <ThemedText style={styles.description}>
                {description}
            </ThemedText>
            {actionLabel && onAction && (
                <View style={styles.actionContainer}>
                    <PrimaryButton
                        label={actionLabel}
                        onPress={onAction}
                        variant="outline"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['3xl'],
    },
    iconContainer: {
        marginBottom: Spacing.lg,
        opacity: 0.8,
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
        maxWidth: 240,
    },
});
