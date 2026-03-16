import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import {
    ArrowRight01Icon,
    Close01Icon,
} from 'hugeicons-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface WithdrawalModalProps {
    visible: boolean;
    onClose: () => void;
    onWithdraw: (amount: number, provider: string, phone: string) => Promise<void>;
    availableBalance: number;
}

const PROVIDERS = ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'];

export default function WithdrawalModal({
    visible,
    onClose,
    onWithdraw,
    availableBalance
}: WithdrawalModalProps) {
    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');

    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const backgroundColor = useThemeColor({}, 'background');
    const placeholderColor = useThemeColor({ light: '#9ca3af', dark: '#6b7280' }, 'text');

    const handleWithdraw = async () => {
        if (!amount || !phone) return;

        setIsSubmitting(true);
        try {
            await onWithdraw(parseFloat(amount), selectedProvider, phone);
            setStep('success');
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setPhone('');
        setStep('input');
        setIsSubmitting(false);
        onClose();
    };

    const renderInputStep = () => (
        <>
            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Select Provider</ThemedText>
                <View style={styles.providerContainer}>
                    {PROVIDERS.map((provider) => (
                        <TouchableOpacity
                            key={provider}
                            style={[
                                styles.providerChip,
                                selectedProvider === provider && { backgroundColor: tintColor, borderColor: tintColor }
                            ]}
                            onPress={() => setSelectedProvider(provider)}
                        >
                            <ThemedText
                                style={[
                                    styles.providerText,
                                    selectedProvider === provider && { color: '#ffffff', fontWeight: 'bold' }
                                ]}
                            >
                                {provider.split(' ')[0]}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Phone Number</ThemedText>
                <View style={[styles.inputContainer, { borderColor: '#e5e7eb' }]}>
                    <Ionicons name="phone-portrait-outline" size={20} color="#9ca3af" />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="024 123 4567"
                        placeholderTextColor={placeholderColor}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Amount (GHS)</ThemedText>
                <View style={[styles.inputContainer, { borderColor: '#e5e7eb' }]}>
                    <ThemedText style={{ fontWeight: 'bold', marginRight: 8 }}>₵</ThemedText>
                    <TextInput
                        style={[styles.input, { color: textColor, fontSize: 18, fontWeight: 'bold' }]}
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>
                <ThemedText style={styles.balanceHint}>
                    Available: GH₵ {availableBalance.toFixed(2)}
                </ThemedText>
            </View>

            <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: tintColor }]}
                onPress={() => setStep('confirm')}
                disabled={!amount || !phone || parseFloat(amount) > availableBalance}
            >
                <ThemedText style={styles.submitButtonText}>Review Withdrawal</ThemedText>
                <ArrowRight01Icon size={18} color="#ffffff" />
            </TouchableOpacity>
        </>
    );

    const renderConfirmStep = () => (
        <>
            <View style={styles.confirmBox}>
                <ThemedText style={styles.confirmLabel}>You are withdrawing</ThemedText>
                <ThemedText style={[styles.confirmAmount, { color: tintColor }]}>GH₵ {parseFloat(amount).toFixed(2)}</ThemedText>
                <View style={styles.divider} />
                <View style={styles.confirmRow}>
                    <ThemedText style={styles.confirmKey}>To:</ThemedText>
                    <ThemedText style={styles.confirmValue}>{phone}</ThemedText>
                </View>
                <View style={styles.confirmRow}>
                    <ThemedText style={styles.confirmKey}>Provider:</ThemedText>
                    <ThemedText style={styles.confirmValue}>{selectedProvider}</ThemedText>
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.backButton]}
                    onPress={() => setStep('input')}
                >
                    <ThemedText style={{ color: '#6b7280' }}>Back</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: tintColor, flex: 1 }]}
                    onPress={handleWithdraw}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <ThemedText style={styles.submitButtonText}>Confirm</ThemedText>
                            <Ionicons name="card-outline" size={18} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </>
    );

    const renderSuccessStep = () => (
        <View style={styles.successContainer}>
            <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={40} color="#ffffff" />
            </View>
            <ThemedText style={styles.successTitle}>Withdrawal Initiated!</ThemedText>
            <ThemedText style={styles.successMessage}>
                Your request for GHS {amount} has been processed successfully. You will receive an SMS confirmation shortly.
            </ThemedText>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.modalContentWrapper}
                        >
                            <ThemedView style={[styles.modalContent, { backgroundColor }]}>
                                {step !== 'success' && (
                                    <View style={styles.header}>
                                        <ThemedText style={styles.title}>
                                            {step === 'input' ? 'Withdraw Funds' : 'Confirm Withdrawal'}
                                        </ThemedText>
                                        <TouchableOpacity onPress={handleClose}>
                                            <Close01Icon size={24} color={textColor} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {step === 'input' && renderInputStep()}
                                {step === 'confirm' && renderConfirmStep()}
                                {step === 'success' && renderSuccessStep()}
                            </ThemedView>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContentWrapper: {
        width: '100%',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        minHeight: 400,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '700',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Gilroy-Medium',
        marginBottom: 8,
        color: '#6b7280',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontFamily: 'Gilroy-Medium',
        fontSize: 16,
    },
    providerContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    providerChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: 'transparent',
    },
    providerText: {
        fontSize: 14,
        fontFamily: 'Gilroy-Medium',
        color: '#6b7280',
    },
    balanceHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 6,
        textAlign: 'right',
    },
    submitButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '600',
    },
    confirmBox: {
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    confirmLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    confirmAmount: {
        fontSize: 32,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '700',
        marginBottom: 16,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: '#e5e7eb',
        marginBottom: 16,
    },
    confirmRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    confirmKey: {
        color: '#6b7280',
        fontSize: 14,
    },
    confirmValue: {
        fontFamily: 'Gilroy-SemiBold',
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    successContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    successIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 20,
        fontFamily: 'Gilroy-Bold',
        marginBottom: 8,
    },
    successMessage: {
        textAlign: 'center',
        color: '#6b7280',
        lineHeight: 22,
    },
});
