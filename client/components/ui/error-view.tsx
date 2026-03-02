import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '../themed-text';

const { width } = Dimensions.get('window');

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
    retryLabel = 'TRY AGAIN',
    isLoading = false,
    showBackButton = true,
}: ErrorViewProps) {
    const errorColor = '#FF0000';

    const getIconName = () => {
        switch (type) {
            case 'network':
                return 'cloud-offline-outline';
            case 'server':
                return 'server-outline';
            case 'not-found':
                return 'search-outline';
            case 'critical':
                return 'alert-circle-outline';
            default:
                return 'alert-circle-outline';
        }
    };

    const getTitle = () => {
        if (title) return title;
        return 'Error!';
    };

    const getMessage = () => {
        if (message) return message;
        switch (type) {
            case 'network':
                return "We're having trouble reaching our servers. Please check your internet connection.";
            case 'server':
                return "Our servers are currently experiencing issues. Please try again later.";
            case 'not-found':
                return "We couldn't find the data you were looking for.";
            case 'critical':
                return "The app encountered a critical error. Please reload the screen.";
            default:
                return "An unexpected error occurred. Please try again.";
        }
    };

    // Styles defined inside to ensure they are available even if the global StyleSheet scope has issues
    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: Spacing.xl,
        },
        card: {
            backgroundColor: '#FFFFFF',
            width: '100%',
            maxWidth: 340,
            borderRadius: 32,
            padding: Spacing.xl,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
        },
        title: {
            color: errorColor,
            fontSize: 32,
            fontFamily: 'Gilroy-SemiBold',
            marginBottom: Spacing.lg,
            textAlign: 'center',
        },
        iconOuterCircle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 2,
            borderColor: errorColor,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.xl,
        },
        iconInnerCircle: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: errorColor,
            justifyContent: 'center',
            alignItems: 'center',
        },
        message: {
            color: '#4B5563',
            fontSize: 16,
            fontFamily: 'Gilroy-Regular',
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: Spacing['2xl'],
            paddingHorizontal: Spacing.sm,
        },
        retryButton: {
            backgroundColor: errorColor,
            width: '100%',
            height: 56,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.md,
        },
        retryButtonText: {
            color: '#FFFFFF',
            fontSize: 18,
            fontFamily: 'Gilroy-SemiBold',
            letterSpacing: 1,
        },
        backButton: {
            paddingVertical: Spacing.sm,
        },
        backButtonText: {
            color: '#9CA3AF',
            fontSize: 14,
            fontFamily: 'Gilroy-Medium',
        },
    });

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <ThemedText style={styles.title}>{getTitle()}</ThemedText>

                <View style={styles.iconOuterCircle}>
                    <View style={styles.iconInnerCircle}>
                        <Ionicons name={getIconName()} size={40} color="#FFFFFF" />
                    </View>
                </View>

                <ThemedText style={styles.message}>{getMessage()}</ThemedText>

                {onRetry && (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        <ThemedText style={styles.retryButtonText}>
                            {isLoading ? 'LOADING...' : retryLabel}
                        </ThemedText>
                    </TouchableOpacity>
                )}

                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.6}
                    >
                        <ThemedText style={styles.backButtonText}>GO BACK</ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
