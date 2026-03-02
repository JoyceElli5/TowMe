/**
 * useOperatorEarnings
 * 
 * Custom hook for managing operator earnings data:
 * - Fetches wallet balance and transaction history
 * - Handles pull-to-refresh logic
 * - Manages withdrawal requests
 * - Identifies the current operator automatically
 */

import { useCallback, useEffect, useState } from 'react';

import { getCurrentUser } from '@/lib/api';
import {
    getWalletBalance,
    getWalletTransactions,
    requestWithdrawal,
    type WalletBalance,
    type WalletTransaction
} from '@/lib/api/wallet';

interface OperatorEarningsState {
    balance: WalletBalance | null;
    transactions: WalletTransaction[];
    loading: boolean;
    refreshing: boolean;
    userId: string | null;
}

export function useOperatorEarnings() {
    const [state, setState] = useState<OperatorEarningsState>({
        balance: null,
        transactions: [],
        loading: true,
        refreshing: false,
        userId: null,
    });

    const fetchData = useCallback(async (userId: string, isRefreshing = false) => {
        if (isRefreshing) {
            setState(prev => ({ ...prev, refreshing: true }));
        } else {
            setState(prev => ({ ...prev, loading: true }));
        }

        try {
            const [balanceData, transactionsData] = await Promise.all([
                getWalletBalance(userId),
                getWalletTransactions(userId, { limit: 20 })
            ]);

            setState(prev => ({
                ...prev,
                balance: balanceData,
                transactions: transactionsData,
                loading: false,
                refreshing: false,
            }));
        } catch (error) {
            console.error('Failed to load wallet data:', error);
            setState(prev => ({ ...prev, loading: false, refreshing: false }));
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const user = await getCurrentUser();
                if (user && mounted) {
                    setState(prev => ({ ...prev, userId: user.id }));
                    fetchData(user.id);
                }
            } catch (error) {
                console.error('Failed to get current user for earnings:', error);
                if (mounted) setState(prev => ({ ...prev, loading: false }));
            }
        };

        init();

        return () => {
            mounted = false;
        };
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        if (state.userId) {
            fetchData(state.userId, true);
        }
    }, [state.userId, fetchData]);

    const handleWithdrawal = async (amount: number, provider: string, phone: string) => {
        if (!state.userId) throw new Error('User not logged in');

        try {
            await requestWithdrawal(state.userId, amount, {
                provider,
                phoneNumber: phone
            });
            // Refresh data to show updated balance/transaction
            onRefresh();
            return { success: true };
        } catch (error) {
            console.error('Withdrawal failed:', error);
            throw error;
        }
    };

    return {
        ...state,
        onRefresh,
        handleWithdrawal,
    };
}
