import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import PrimaryButton from '../primary-button';
import { ThemedText } from '../themed-text';

interface PermissionDeniedProps {
    type: 'location' | 'notifications';
    description?: string;
}

export function PermissionDenied({ type, description }: PermissionDeniedProps) {
    const handleOpenSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    };

    const title = type === 'location' ? 'Location Access Required' : 'Notifications Disabled';
    const defaultDescription = type === 'location'
        ? 'We need your location to find nearby tow truck operators and provide accurate ETAs.'
        : 'Turn on notifications to get real-time updates on your tow request status.';

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="settings-outline" size={40} color="#64748B" />
            </View>
            <ThemedText type="subtitle" style={styles.title}>
                {title}
            </ThemedText>
            <ThemedText style={styles.description}>
                {description || defaultDescription}
            </ThemedText>
            <View style={styles.actionContainer}>
                <PrimaryButton
                    label="Open Settings"
                    onPress={handleOpenSettings}
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
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F1F5F9',
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
        maxWidth: 240,
    },
});
