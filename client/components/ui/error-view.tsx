import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import PrimaryButton from '../primary-button';
import { ThemedText } from '../themed-text';

export type ErrorType = 'network' | 'server' | 'not-found' | 'generic' | 'critical';

interface ErrorViewProps {
    type?: ErrorType;
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryLabel?: string;
    isLoading?: boolean;
    showBackButton?: boolean;
}

export function ErrorView({
    type = 'generic',
    title,
    message,
    onRetry,
    retryLabel = 'Try Again',
    isLoading = false,
    showBackButton = true,
}: ErrorViewProps) {
    const backgroundColor = useThemeColor({}, 'background');
    const mutedColor = useThemeColor({}, 'muted');
    const errorColor = '#EF4444';
    const secondaryColor = '#64748B';

    const getIconData = () => {
        switch (type) {
            case 'network':
                return { name: 'wifi-outline' as const, color: errorColor, bg: '#FEE2E2' };
            case 'server':
                return { name: 'server-outline' as const, color: secondaryColor, bg: '#F1F5F9' };
            case 'not-found':
                return { name: 'search-outline' as const, color: secondaryColor, bg: '#F1F5F9' };
            case 'critical':
                return { name: 'flash-outline' as const, color: errorColor, bg: '#FEE2E2' };
            default:
                return { name: 'alert-circle-outline' as const, color: errorColor, bg: '#FEE2E2' };
        }
    };

    const getTitle = () => {
        if (title) return title;
        switch (type) {
            case 'network':
                return 'Connection Error';
            case 'server':
                return 'Server Offline';
            case 'not-found':
                return 'Not Found';
            case 'critical':
                return 'Critical Error';
            default:
                return 'Something went wrong';
        }
    };

    const getMessage = () => {
        if (message) return message;
        switch (type) {
            case 'network':
                return "We're having trouble reaching our servers. Please check your internet connection and try again.";
            case 'server':
                return "Our servers are currently experiencing issues. We're working on fixing it. Please try again later.";
            case 'not-found':
                return "We couldn't find the page or data you were looking for.";
            case 'critical':
                return "The app encountered a critical error. Our team has been notified. You may need to restart.";
            default:
                return "An unexpected error occurred. Please try again or contact support if the issue persists.";
        }
    };

    const iconData = getIconData();

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
                    <Ionicons name={iconData.name} size={48} color={iconData.color} />
                </View>
            </View>

            <View style={styles.content}>
                <ThemedText style={styles.title}>
                    {getTitle()}
                </ThemedText>
                <ThemedText style={styles.description}>
                    {getMessage()}
                </ThemedText>
            </View>

            <View style={styles.footer}>
                {onRetry && (
                    <PrimaryButton
                        label={retryLabel}
                        onPress={onRetry}
                        isLoading={isLoading}
                        variant="primary"
                        style={styles.mainButton}
                    />
                )}

                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={isLoading}
                    >
                        <ThemedText style={styles.backButtonText}>
                            Go Back
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.xl * 1.5,
        paddingVertical: Spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    content: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    title: {
        fontSize: Typography.sizes['2xl'],
        lineHeight: Typography.lineHeights['2xl'],
        fontFamily: 'Gilroy-SemiBold',
        textAlign: 'center',
        marginBottom: Spacing.md,
        color: '#1E293B',
    },
    description: {
        fontSize: Typography.sizes.md,
        lineHeight: Typography.lineHeights.md,
        fontFamily: 'Gilroy-Regular',
        textAlign: 'center',
        color: '#64748B',
        paddingHorizontal: Spacing.sm,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    mainButton: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    backButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    backButtonText: {
        fontSize: Typography.sizes.md,
        fontFamily: 'Gilroy-Medium',
        color: '#64748B',
    },
});
