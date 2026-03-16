import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface EarningsModalProps {
    visible: boolean;
    onClose: () => void;
    earnings: number;
    tripsToday: number;
}

export default function EarningsModal({
    visible,
    onClose,
    earnings,
    tripsToday,
}: EarningsModalProps) {
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <ThemedView style={[styles.container, { backgroundColor }]}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>{"Today's Earnings"}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={tintColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.totalContainer}>
                        <ThemedText style={styles.currency}>GH₵</ThemedText>
                        <ThemedText style={[styles.totalAmount, { color: tintColor }]}>
                            {earnings.toFixed(2)}
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>Total Net Earnings</ThemedText>
                    </View>

                    <View style={styles.breakdownContainer}>
                        <View style={styles.breakdownItem}>
                            <ThemedText style={styles.breakdownLabel}>Completed Trips</ThemedText>
                            <ThemedText style={styles.breakdownValue}>{tripsToday}</ThemedText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.breakdownItem}>
                            <ThemedText style={styles.breakdownLabel}>Trip Fares</ThemedText>
                            <ThemedText style={styles.breakdownValue}>GH₵ {earnings.toFixed(2)}</ThemedText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.breakdownItem}>
                            <ThemedText style={styles.breakdownLabel}>Tips</ThemedText>
                            <ThemedText style={styles.breakdownValue}>GH₵ 0.00</ThemedText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.breakdownItem}>
                            <ThemedText style={styles.breakdownLabel}>Bonuses</ThemedText>
                            <ThemedText style={styles.breakdownValue}>GH₵ 0.00</ThemedText>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.button, { backgroundColor: tintColor }]} onPress={onClose}>
                        <ThemedText style={styles.buttonText}>Close</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Gilroy-Bold',
    },
    closeButton: {
        padding: 4,
    },
    totalContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    currency: {
        fontSize: 24,
        color: '#6b7280',
        marginBottom: 4,
        fontFamily: 'Gilroy-Medium',
    },
    totalAmount: {
        fontSize: 48,
        fontWeight: '700',
        fontFamily: 'Gilroy-Bold',
        lineHeight: 56,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
        fontFamily: 'Gilroy-Regular',
    },
    breakdownContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    breakdownLabel: {
        fontSize: 16,
        color: '#4b5563',
        fontFamily: 'Gilroy-Medium',
    },
    breakdownValue: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Gilroy-SemiBold',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    button: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Gilroy-SemiBold',
    },
});
