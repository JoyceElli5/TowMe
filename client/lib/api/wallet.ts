import { api } from './client';

export interface WalletTransaction {
    id: string;
    userId: string;
    type: 'trip_payment' | 'withdrawal' | 'bonus' | 'tip' | 'platform_fee' | 'commission_payment';
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    referenceId?: string;
    description: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface WalletBalance {
    available: number;
    pending: number;
    withdrawn: number;
    currency: string;
    commissionOwed: number;
    commissionPaid: number;
    outstandingBalance: number;
    grossEarnings: number;
    netEarnings: number;
    suspended: boolean;
    suspensionThreshold: number;
}

const EMPTY_BALANCE: WalletBalance = {
    available: 0,
    pending: 0,
    withdrawn: 0,
    currency: 'GHS',
    commissionOwed: 0,
    commissionPaid: 0,
    outstandingBalance: 0,
    grossEarnings: 0,
    netEarnings: 0,
    suspended: false,
    suspensionThreshold: 100,
};

/**
 * Fetch the current operator's wallet balance.
 * Returns zeroed-out balance if backend wallet endpoint isn't reachable
 * (e.g. older deployed backend) — NEVER fake data.
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
    try {
        const response = await api.get<WalletBalance>(`/wallet/${userId}/balance`);
        if (response.success && response.data) {
            return { ...EMPTY_BALANCE, ...response.data };
        }
        return EMPTY_BALANCE;
    } catch (error: any) {
        // 404 = endpoint not deployed yet; fall through to empty balance silently
        if (error?.status !== 404) {
            console.error('Error fetching wallet balance:', error);
        }
        return EMPTY_BALANCE;
    }
}

/**
 * Fetch wallet transaction history.
 */
export async function getWalletTransactions(
    userId: string,
    params: { limit?: number; offset?: number; type?: string } = {}
): Promise<WalletTransaction[]> {
    try {
        const response = await api.get<WalletTransaction[]>(`/wallet/${userId}/transactions`, params);
        if (response.success && response.data) {
            return response.data;
        }
        return [];
    } catch (error: any) {
        if (error?.status !== 404) {
            console.error('Error fetching transactions:', error);
        }
        return [];
    }
}

/**
 * Request a withdrawal.
 */
export async function requestWithdrawal(
    userId: string,
    amount: number,
    details: { provider: string; phoneNumber: string; accountName?: string }
): Promise<WalletTransaction> {
    const response = await api.post<WalletTransaction>('/wallet/withdraw', {
        userId,
        amount,
        ...details,
    });

    if (response.success && response.data) {
        return response.data;
    }
    throw new Error(response.message || 'Withdrawal failed');
}
