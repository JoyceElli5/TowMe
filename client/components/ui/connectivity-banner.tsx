import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '../themed-text';

interface ConnectivityBannerProps {
    isOffline: boolean;
}

export function ConnectivityBanner({ isOffline }: ConnectivityBannerProps) {
    const translateY = useRef(new Animated.Value(-100)).current;
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOffline) {
            setShouldRender(true);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) setShouldRender(false);
            });
        }
    }, [isOffline, translateY]);

    if (!shouldRender) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
            <View style={styles.content}>
                <Ionicons name="wifi-outline" size={18} color="#FFFFFF" />
                <ThemedText style={styles.text}>
                    No Internet Connection
                </ThemedText>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: 50, // Typical status bar height + padding
        backgroundColor: '#EF4444',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Gilroy-Medium',
    },
});
