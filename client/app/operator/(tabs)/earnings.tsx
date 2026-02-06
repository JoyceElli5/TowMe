/**
 * Earnings & Wallet Screen
 * 
 * Comprehensive financial dashboard for operators.
 * Includes earnings summary, wallet balance, and transaction history.
 */

import { Ionicons } from '@expo/vector-icons';
import {
    ArrowRight01Icon,
    CreditCardIcon,
    TransactionIcon,
    Wallet01Icon
} from 'hugeicons-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text // Explicitly imported
    ,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WithdrawalModal from '@/components/operator/withdrawal-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
    getWalletBalance,
    getWalletTransactions,
    requestWithdrawal,
    WalletBalance,
    WalletTransaction
} from '@/lib/api/wallet';

const PERIODS = ['Daily', 'Weekly', 'Monthly'] as const;
type Period = typeof PERIODS[number];

// Use a hardcoded user ID for now since we don't have auth context easily accessible yet
// In a real app this would come from useAuth()
const MOCK_USER_ID = '36398504-646f-45e8-9b96-a23921cf5ad2';

export default function EarningsWalletScreen() {
    const backgroundColor = useThemeColor({}, 'background');
    const tintColor = useThemeColor({ light: '#003554', dark: '#60A5FA' }, 'tint');
    const cardBg = useThemeColor({ light: '#ffffff', dark: '#1F2937' }, 'background');
    const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'background');

    const [selectedPeriod, setSelectedPeriod] = useState<Period>('Weekly');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);

    const fetchData = async () => {
        try {
            const [balanceData, transactionsData] = await Promise.all([
                getWalletBalance(MOCK_USER_ID),
                getWalletTransactions(MOCK_USER_ID, { limit: 10 })
            ]);
            setBalance(balanceData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedPeriod]); // Reload when period changes (dummy for now)

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleWithdrawal = async (amount: number, provider: string, phone: string) => {
        try {
            await requestWithdrawal(MOCK_USER_ID, amount, { provider, phoneNumber: phone });
            // Refresh data to show updated balance/transaction
            onRefresh();
        } catch (error) {
            console.error('Withdrawal failed:', error);
            alert('Withdrawal failed. Please try again.');
        }
    };

    const renderPeriodSelector = () => (
        <View style={styles.periodContainer}>
            <View style={styles.periodSelector}>
                {PERIODS.map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && { backgroundColor: tintColor }
                        ]}
                        onPress={() => setSelectedPeriod(period)}
                    >
                        <ThemedText
                            style={[
                                styles.periodText,
                                selectedPeriod === period && { color: '#ffffff', fontWeight: 'bold' }
                            ]}
                        >
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
                <ThemedText style={styles.cardTitle}>Earnings Summary</ThemedText>
                <CreditCardIcon size={20} color={tintColor} />
            </View>

            <View style={styles.mainEarnings}>
                <ThemedText style={styles.earningsLabel}>Total Earnings ({selectedPeriod})</ThemedText>
                <ThemedText style={[styles.earningsValue, { color: tintColor }]}>
                    {/* Calculate dynamically later */}
                    GH₵ 1,240.00
                </ThemedText>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownLabel}>Gross</ThemedText>
                    <ThemedText style={styles.breakdownValue}>GH₵ 1,550</ThemedText>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderColor }]} />
                <View style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownLabel}>Fees (20%)</ThemedText>
                    <ThemedText style={[styles.breakdownValue, { color: '#ef4444' }]}>-GH₵ 310</ThemedText>
                </View>
                <View style={[styles.verticalDivider, { backgroundColor: borderColor }]} />
                <View style={styles.breakdownItem}>
                    <ThemedText style={styles.breakdownLabel}>Net Payout</ThemedText>
                    <ThemedText style={[styles.breakdownValue, { color: '#22c55e' }]}>GH₵ 1,240</ThemedText>
                </View>
            </View>
        </ThemedView>
    );

    const renderWalletCard = () => (
        <View style={[styles.walletCard, { backgroundColor: '#003554' }]}>
            <View style={styles.walletHeader}>
                <View>
                    <ThemedText style={styles.walletLabel}>Available Balance</ThemedText>
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <ThemedText style={styles.walletBalance}>
                            {balance?.currency} {balance?.available.toFixed(2)}
                        </ThemedText>
                    )}
                </View>
                <View style={styles.walletIconContainer}>
                    <Wallet01Icon size={24} color="#ffffff" />
                </View>
            </View>

            <View style={styles.walletDetails}>
                <View style={styles.walletDetailItem}>
                    <ThemedText style={styles.walletDetailLabel}>Pending</ThemedText>
                    <ThemedText style={styles.walletDetailValue}>
                        {balance?.currency} {balance?.pending.toFixed(2)}
                    </ThemedText>
                </View>
                <View style={styles.walletDetailItem}>
                    <ThemedText style={styles.walletDetailLabel}>Withdrawn</ThemedText>
                    <ThemedText style={styles.walletDetailValue}>
                        {balance?.currency} {balance?.withdrawn.toFixed(2)}
                    </ThemedText>
                </View>
            </View>

            <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => setWithdrawalModalVisible(true)}
            >
                <ThemedText style={styles.withdrawButtonText}>Withdraw Funds</ThemedText>
                <ArrowRight01Icon size={16} color="#003554" />
            </TouchableOpacity>
        </View>
    );

    const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
        <TouchableOpacity style={[styles.transactionItem, { backgroundColor: cardBg }]}>
            <View style={[styles.transactionIcon, { backgroundColor: item.amount > 0 ? '#dcfce7' : '#fee2e2' }]}>
                {item.type === 'trip_payment' ? (
                    <TransactionIcon size={20} color={item.amount > 0 ? '#16a34a' : '#dc2626'} />
                ) : item.type === 'withdrawal' ? (
                    <Wallet01Icon size={20} color="#dc2626" />
                ) : (
                    <CreditCardIcon size={20} color="#16a34a" />
                )}
            </View>

            <View style={styles.transactionInfo}>
                <ThemedText style={styles.transactionTitle}>{item.description}</ThemedText>
                <ThemedText style={styles.transactionDate}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
            </View>

            <View style={styles.transactionAmount}>
                <ThemedText style={[
                    styles.amountText,
                    { color: item.amount > 0 ? '#16a34a' : '#1f2937' }
                ]}>
                    {item.amount > 0 ? '+' : ''} {item.currency} {Math.abs(item.amount).toFixed(2)}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: item.status === 'completed' ? '#16a34a' : '#f59e0b', marginRight: 4, fontFamily: 'Gilroy-Medium' }}>
                        {item.status.toUpperCase()}
                    </Text>
                    {item.status === 'completed' && (
                        <Ionicons name="receipt-outline" size={16} color="#9ca3af" />
                    )}
                </View>
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
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tintColor} />
                    }
                >
                    {renderPeriodSelector()}
                    {renderWalletCard()}
                    {renderEarningsSummary()}

                    {/* Incentives Section - Keeping static as placeholder for now */}
                    <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.cardHeader}>
                            <ThemedText style={styles.cardTitle}>Active Bonus</ThemedText>
                            <View style={styles.bonusBadge}>
                                <ThemedText style={styles.bonusBadgeText}>+50 GHS</ThemedText>
                            </View>
                        </View>

                        <View style={styles.bonusContent}>
                            <ThemedText style={styles.bonusDescription}>Complete 5 more trips this week to unlock your bonus!</ThemedText>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { width: '60%', backgroundColor: '#22c55e' }]} />
                            </View>
                            <View style={styles.progressLabels}>
                                <ThemedText style={styles.progressText}>15/20 Trips</ThemedText>
                                <ThemedText style={styles.progressText}>3 days left</ThemedText>
                            </View>
                        </View>
                    </ThemedView>

                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
                        <TouchableOpacity onPress={() => { }}>
                            <ThemedText style={{ color: tintColor, fontFamily: 'Gilroy-Medium' }}>See All</ThemedText>
                        </TouchableOpacity>
                    </View>

                    <View style={{ gap: 12, paddingBottom: 100 }}>
                        {loading && !refreshing ? (
                            <ActivityIndicator size="large" color={tintColor} style={{ marginTop: 20 }} />
                        ) : (
                            transactions.map(item => (
                                <View key={item.id}>
                                    {renderTransactionItem({ item })}
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                <WithdrawalModal
                    visible={withdrawalModalVisible}
                    onClose={() => setWithdrawalModalVisible(false)}
                    onWithdraw={handleWithdrawal}
                    availableBalance={balance?.available || 0}
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '700',
    },
    periodContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 25,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 21,
    },
    periodText: {
        fontSize: 14,
        fontFamily: 'Gilroy-Medium',
        color: '#6b7280',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Gilroy-SemiBold',
        fontWeight: '600',
    },
    mainEarnings: {
        marginBottom: 16,
    },
    earningsLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontFamily: 'Gilroy-Regular',
        marginBottom: 4,
    },
    earningsValue: {
        fontSize: 32,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        marginBottom: 16,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownItem: {
        alignItems: 'center',
        flex: 1,
    },
    verticalDivider: {
        width: 1,
        height: '100%',
    },
    breakdownLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        fontFamily: 'Gilroy-Regular',
    },
    breakdownValue: {
        fontSize: 14,
        fontFamily: 'Gilroy-SemiBold',
        fontWeight: '600',
    },
    walletCard: {
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 20,
        shadowColor: '#003554',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    walletHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    walletLabel: {
        fontSize: 14,
        color: '#bae6fd',
        fontFamily: 'Gilroy-Medium',
        marginBottom: 6,
    },
    walletBalance: {
        fontSize: 36,
        color: '#ffffff',
        fontFamily: 'Gilroy-Bold',
        fontWeight: '700',
    },
    walletIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletDetails: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 24,
    },
    walletDetailItem: {
        flex: 1,
    },
    walletDetailLabel: {
        fontSize: 12,
        color: '#bae6fd',
        fontFamily: 'Gilroy-Regular',
        marginBottom: 4,
    },
    walletDetailValue: {
        fontSize: 16,
        color: '#ffffff',
        fontFamily: 'Gilroy-SemiBold',
    },
    withdrawButton: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    withdrawButtonText: {
        color: '#003554',
        fontSize: 16,
        fontFamily: 'Gilroy-SemiBold',
        fontWeight: '600',
    },
    bonusBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bonusBadgeText: {
        color: '#16a34a',
        fontSize: 12,
        fontFamily: 'Gilroy-Bold',
    },
    bonusContent: {
        marginTop: 8,
    },
    bonusDescription: {
        fontSize: 14,
        fontFamily: 'Gilroy-Medium',
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Gilroy-Regular',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Gilroy-SemiBold',
        fontWeight: '600',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#ffffff',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontFamily: 'Gilroy-SemiBold',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Gilroy-Regular',
    },
    transactionAmount: {
        alignItems: 'flex-end',
    },
    amountText: {
        fontSize: 16,
        fontFamily: 'Gilroy-Bold',
        fontWeight: '600',
    },
});
