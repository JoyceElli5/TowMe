
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SOSButtonProps {
    onPress: () => void;
}

export default function SOSButton({ onPress }: SOSButtonProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
            </View>
            <ThemedText style={styles.text}>SOS</ThemedText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        bottom: 220, // Positioned above the bottom card
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 16,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        gap: 8,
    },
    iconContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
        fontFamily: 'Gilroy-Bold',
    },
});
