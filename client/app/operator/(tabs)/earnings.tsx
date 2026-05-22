/**
 * Earnings & Wallet Screen
 * Full commission dashboard: gross earnings, TowMe fees, net payout,
 * outstanding commission balance, and suspension warning.
 */

import { Ionicons } from '@expo/vector-icons';
import {
    ArrowRight01Icon,
    CreditCardIcon,
    TransactionIcon,
    Wallet01Icon,
} from 'hugeicons-react-native';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WithdrawalModal from '@/components/operator/withdrawal-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useOperatorEarnings } from '@/hooks/use-operator-earnings';
import { useThemeColor } from '@/hooks/use-theme-color';
import { WalletTransaction } from '@/lib/api/wallet';

const PERIODS = ['Daily', 'Weekly', 'Monthly'] as const;
type Period = typeof PERIODS[number];

export default function EarningsWalletScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');
    const textColor = useThemeColor({ light: '#111827', dark: '#f9fafb' }, 'text');

    const [selectedPeriod, setSelectedPeriod] = useState<Period>('Weekly');
    const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);

    const {
        balance,
        transactions,
        loading,
        refreshing,
        onRefresh,
        handleWithdrawal
    } = useOperatorEarnings();

    const isSuspended = balance?.suspended ?? false;
    const outstandingBalance = balance?.outstandingBalance ?? 0;
    const suspensionThreshold = balance?.suspensionThreshold ?? 100;

    // Period earnings come directly from the trip-payment transactions returned by the backend.
    // For a brand-new operator with no trips, everything is zero — no fake/mock numbers.
    const periodEarnings = useMemo(() => {
        const now = new Date();
        const cutoff = new Date(now);
        if (selectedPeriod === 'Daily') cutoff.setHours(0, 0, 0, 0);
        else if (selectedPeriod === 'Weekly') cutoff.setDate(now.getDate() - 7);
        else cutoff.setDate(now.getDate() - 30);

        const gross = transactions
            .filter(t => t.type === 'trip_payment' && t.status === 'completed' && new Date(t.createdAt) >= cutoff)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const fees = Math.round(gross * 0.20 * 100) / 100;
        const net = Math.round((gross - fees) * 100) / 100;
        return { gross, fees, net };
    }, [transactions, selectedPeriod]);

    const onWithdraw = async (amount: number, provider: string, phone: string) => {
        try {
            await handleWithdrawal(amount, provider, phone);
            Alert.alert('Success', 'Withdrawal request submitted. Processing within 24 hours.');
            setWithdrawalModalVisible(false);
        } catch {
            Alert.alert('Error', 'Failed to submit withdrawal request.');
        }
    };

    const renderSuspensionBanner = () => {
        if (!isSuspended) return null;
        return (
            <View style={styles.suspensionBanner}>
                <View style={styles.suspensionIconRow}>
                    <Ionicons name="warning" size={22} color="#dc2626" />
                    <Text style={styles.suspensionTitle}>Account Suspended</Text>
                </View>
                <Text style={styles.suspensionMessage}>
                    You have exceeded your unpaid commission limit (GH₵{suspensionThreshold.toFixed(0)}). Please settle your balance to continue accepting requests.
                </Text>
                <View style={styles.suspensionBalance}>
                    <Text style={styles.suspensionBalanceLabel}>Outstanding Balance</Text>
                    <Text style={styles.suspensionBalanceValue}>GH₵ {outstandingBalance.toFixed(2)}</Text>
                </View>
            </View>
        );
    };

    const renderCommissionWarning = () => {
        if (isSuspended || outstandingBalance <= 0) return null;
        const pct = Math.min(100, (outstandingBalance / suspensionThreshold) * 100);
        const isNearLimit = pct >= 70;
        return (
            <View style={[styles.commissionCard, { backgroundColor: isNearLimit ? '#fff7ed' : cardBg, borderColor: isNearLimit ? '#fed7aa' : borderColor }]}>
                <View style={styles.commissionHeader}>
                    <Text style={[styles.commissionTitle, { color: isNearLimit ? '#c2410c' : textColor }]}>
                        Commission Due to TowMe
                    </Text>
                    {isNearLimit && <Ionicons name="alert-circle" size={18} color="#f97316" />}
                </View>
                <Text style={[styles.commissionAmount, { color: isNearLimit ? '#dc2626' : '#f97316' }]}>
                    GH₵ {outstandingBalance.toFixed(2)}
                </Text>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: isNearLimit ? '#ef4444' : '#f97316' }]} />
                </View>
                <Text style={styles.progressCaption}>
                    GH₵ {outstandingBalance.toFixed(2)} of GH₵ {suspensionThreshold.toFixed(0)} limit used
                </Text>
            </View>
        );
    };

    const renderPeriodSelector = () => (
        <View style={styles.periodContainer}>
            <View style={styles.periodSelector}>
                {PERIODS.map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[styles.periodButton, selectedPeriod === period && { backgroundColor: tintColor }]}
                        onPress={() => setSelectedPeriod(period)}
                    >
                        <ThemedText style={[styles.periodText, selectedPeriod === period && { color: '#fff', fontWeight: 'bold' }]}>
                            {period}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderEarningsSummary = () => (
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>Earnings Summary ({selectedPeriod})</ThemedText>
                <CreditCardIcon size={20} color={tintColor} />
            </View>

            {/* Net Payout Hero */}
            <View style={styles.mainEarnings}>
                <ThemedText style={styles.earningsLabel}>Net Payout</ThemedText>
                <ThemedText style={[styles.earningsValue, { color: '#22c55e' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                    GH₵ {periodEarnings.net.toFixed(2)}
                </ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* 3-column breakdown */}
            <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownLabel}>Gross</ThemedText>
                    <ThemedText style={[styles.breakdownValue, { color: textColor }]}>GH₵ {periodEarnings.gross.toFixed(0)}</ThemedText>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderColor }]} />
                <View style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownLabel}>TowMe Fee (20%)</ThemedText>
                    <ThemedText style={[styles.breakdownValue, { color: '#ef4444' }]}>-GH₵ {periodEarnings.fees.toFixed(0)}</ThemedText>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderColor }]} />
                <View style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownLabel}>Net</ThemedText>
                    <ThemedText style={[styles.breakdownValue, { color: '#22c55e' }]}>GH₵ {periodEarnings.net.toFixed(0)}</ThemedText>
                </View>
            </View>
        </ThemedView>
    );

    const renderAllTimeStats = () => {
        if (!balance) return null;
        return (
            <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.cardHeader}>
                    <ThemedText style={styles.cardTitle}>All-Time Overview</ThemedText>
                    <TransactionIcon size={20} color={tintColor} />
                </View>
                <View style={styles.statsGrid}>
                    <View style={[styles.statItem, { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12 }]}>
                        <Text style={styles.statLabel}>Gross Earnings</Text>
                        <Text style={[styles.statValue, { color: '#16a34a' }]}>GH₵ {balance.grossEarnings.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#fef2f2', borderRadius: 12, padding: 12 }]}>
                        <Text style={styles.statLabel}>TowMe Fees</Text>
                        <Text style={[styles.statValue, { color: '#dc2626' }]}>GH₵ {balance.commissionOwed.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#eff6ff', borderRadius: 12, padding: 12 }]}>
                        <Text style={styles.statLabel}>Net Earnings</Text>
                        <Text style={[styles.statValue, { color: '#2563eb' }]}>GH₵ {balance.netEarnings.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#fefce8', borderRadius: 12, padding: 12 }]}>
                        <Text style={styles.statLabel}>Fees Paid</Text>
                        <Text style={[styles.statValue, { color: '#ca8a04' }]}>GH₵ {balance.commissionPaid.toFixed(2)}</Text>
                    </View>
                </View>
            </ThemedView>
        );
    };

    const renderWalletCard = () => (
        <View style={[styles.walletCard, { backgroundColor: isSuspended ? '#7f1d1d' : '#003554' }]}>
            <View style={styles.walletHeader}>
                <View>
                    <ThemedText style={styles.walletLabel}>Withdrawable Balance</ThemedText>
                    {loading && !balance ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <ThemedText style={styles.walletBalance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                            {balance?.currency || 'GH₵'} {balance?.available.toFixed(2) || '0.00'}
                        </ThemedText>
                    )}
                </View>
                <View style={styles.walletIconContainer}>
                    {isSuspended
                        ? <Ionicons name="warning" size={24} color="#fca5a5" />
                        : <Wallet01Icon size={24} color="#ffffff" />
                    }
                </View>
            </View>

            {isSuspended && (
                <Text style={styles.walletSuspendedNote}>
                    Withdrawals disabled until commission is settled
                </Text>
            )}

            <TouchableOpacity
                style={[styles.withdrawButton, isSuspended && { backgroundColor: '#fca5a5' }]}
                onPress={() => {
                    if (isSuspended) {
                        Alert.alert('Account Suspended', 'Please settle your commission balance before withdrawing.');
                        return;
                    }
                    setWithdrawalModalVisible(true);
                }}
            >
                <ThemedText style={[styles.withdrawButtonText, isSuspended && { color: '#7f1d1d' }]}>
                    {isSuspended ? 'Settle Commission First' : 'Withdraw Funds'}
                </ThemedText>
                <ArrowRight01Icon size={16} color={isSuspended ? '#7f1d1d' : '#003554'} />
            </TouchableOpacity>
        </View>
    );

    const renderTransactionItem = (item: WalletTransaction) => (
        <TouchableOpacity key={item.id} style={[styles.transactionItem, { backgroundColor: cardBg, borderWidth: 1, borderColor }]}>
            <View style={[styles.transactionIcon, { backgroundColor: item.amount > 0 ? '#dcfce7' : '#fee2e2' }]}>
                {item.type === 'trip_payment'
                    ? <TransactionIcon size={20} color={item.amount > 0 ? '#16a34a' : '#dc2626'} />
                    : item.type === 'withdrawal'
                        ? <Wallet01Icon size={20} color="#dc2626" />
                        : <CreditCardIcon size={20} color="#16a34a" />}
            </View>
            <View style={styles.transactionInfo}>
                <ThemedText style={styles.transactionTitle}>{item.description}</ThemedText>
                <ThemedText style={styles.transactionDate}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
            </View>
            <View style={styles.transactionAmount}>
                <ThemedText style={[styles.amountText, { color: item.amount > 0 ? '#16a34a' : '#ef4444' }]}>
                    {item.amount > 0 ? '+' : ''} GH₵ {Math.abs(item.amount).toFixed(2)}
                </ThemedText>
                <Text style={{ fontSize: 10, color: item.status === 'completed' ? '#16a34a' : '#f59e0b', fontFamily: 'Gilroy-Medium' }}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <StatusBar barStyle={backgroundColor === '#151718' ? 'light-content' : 'dark-content'} />
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <ThemedText style={styles.headerTitle}>Earnings & Wallet</ThemedText>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />}
                >
                    {renderSuspensionBanner()}
                    {renderPeriodSelector()}
                    {renderWalletCard()}
                    {renderCommissionWarning()}
                    {renderEarningsSummary()}
                    {renderAllTimeStats()}

                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
                    </View>

                    <View style={{ gap: 12, paddingBottom: 100 }}>
                        {loading && !refreshing && !balance
                            ? <ActivityIndicator size="large" color={tintColor} style={{ marginTop: 20 }} />
                            : transactions.map(item => renderTransactionItem(item))
                        }
                        {!loading && transactions.length === 0 && (
                            <ThemedText style={{ textAlign: 'center', marginTop: 20, color: '#9ca3af' }}>
                                No transactions yet
                            </ThemedText>
                        )}
                    </View>
                </ScrollView>

                <WithdrawalModal
                    visible={withdrawalModalVisible}
                    onClose={() => setWithdrawalModalVisible(false)}
                    onWithdraw={onWithdraw}
                    availableBalance={balance?.available || 0}
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 24, fontFamily: 'Gilroy-Bold', fontWeight: '700' },

    suspensionBanner: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#fef2f2',
        borderWidth: 1.5,
        borderColor: '#fca5a5',
        borderRadius: 16,
        padding: 16,
    },
    suspensionIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    suspensionTitle: { fontSize: 16, fontFamily: 'Gilroy-Bold', color: '#dc2626', fontWeight: '700' },
    suspensionMessage: { fontSize: 13, color: '#991b1b', lineHeight: 19, fontFamily: 'Gilroy-Regular', marginBottom: 12 },
    suspensionBalance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 10, padding: 10 },
    suspensionBalanceLabel: { fontSize: 12, color: '#7f1d1d', fontFamily: 'Gilroy-Medium' },
    suspensionBalanceValue: { fontSize: 16, fontFamily: 'Gilroy-Bold', color: '#dc2626', fontWeight: '700' },

    commissionCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    commissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    commissionTitle: { fontSize: 14, fontFamily: 'Gilroy-SemiBold', fontWeight: '600' },
    commissionAmount: { fontSize: 24, fontFamily: 'Gilroy-Bold', fontWeight: '700', marginBottom: 10 },
    progressBarContainer: { height: 6, backgroundColor: '#fed7aa', borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 3 },
    progressCaption: { fontSize: 11, color: '#9ca3af', fontFamily: 'Gilroy-Regular' },

    periodContainer: { paddingHorizontal: 20, marginBottom: 16 },
    periodSelector: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 25, padding: 4 },
    periodButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 21 },
    periodText: { fontSize: 14, fontFamily: 'Gilroy-Medium', color: '#6b7280' },

    scrollContent: { paddingBottom: 40 },

    card: {
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 16, fontFamily: 'Gilroy-SemiBold', fontWeight: '600' },

    mainEarnings: { marginBottom: 16 },
    earningsLabel: { fontSize: 14, color: '#6b7280', fontFamily: 'Gilroy-Regular', marginBottom: 4 },
    earningsValue: { fontSize: 32, fontFamily: 'Gilroy-Bold', fontWeight: '700' },
    divider: { height: 1, marginBottom: 16 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
    breakdownItem: { alignItems: 'center', flex: 1 },
    verticalDivider: { width: 1, height: '100%' },
    breakdownLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontFamily: 'Gilroy-Regular', textAlign: 'center' },
    breakdownValue: { fontSize: 13, fontFamily: 'Gilroy-SemiBold', fontWeight: '600', textAlign: 'center' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statItem: { width: '47%' },
    statLabel: { fontSize: 11, color: '#6b7280', fontFamily: 'Gilroy-Regular', marginBottom: 4 },
    statValue: { fontSize: 15, fontFamily: 'Gilroy-Bold', fontWeight: '700' },

    walletCard: {
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#003554',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    walletLabel: { fontSize: 14, color: '#bae6fd', fontFamily: 'Gilroy-Medium', marginBottom: 6 },
    walletBalance: { fontSize: 36, color: '#ffffff', fontFamily: 'Gilroy-Bold', fontWeight: '700' },
    walletIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    walletSuspendedNote: { color: '#fca5a5', fontSize: 12, fontFamily: 'Gilroy-Regular', marginBottom: 16 },
    withdrawButton: { backgroundColor: '#ffffff', borderRadius: 16, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    withdrawButtonText: { color: '#003554', fontSize: 16, fontFamily: 'Gilroy-SemiBold', fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontFamily: 'Gilroy-SemiBold', fontWeight: '600' },

    transactionItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 16, borderRadius: 16 },
    transactionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    transactionInfo: { flex: 1 },
    transactionTitle: { fontSize: 15, fontFamily: 'Gilroy-SemiBold', marginBottom: 3 },
    transactionDate: { fontSize: 12, color: '#6b7280', fontFamily: 'Gilroy-Regular' },
    transactionAmount: { alignItems: 'flex-end' },
    amountText: { fontSize: 15, fontFamily: 'Gilroy-Bold', fontWeight: '600' },
});
