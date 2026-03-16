import { api } from './client';

export interface WalletTransaction {
    id: string;
    userId: string;
    type: 'trip_payment' | 'withdrawal' | 'bonus' | 'tip' | 'platform_fee';
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
}

/**
 * Fetch the current operator's wallet balance
 */
export async function getWalletBalance(userId: string): Promise<WalletBalance> {
    try {
        const response = await api.get<WalletBalance>(`/wallet/${userId}/balance`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch wallet balance');
    } catch (error) {
        // Suppress 404/API errors in DEV to show mock data without RedBox
        if (__DEV__) {
            console.warn('[Dev] Using mock wallet balance (API unreachable)');
            return {
                available: 450.00,
                pending: 120.00,
                withdrawn: 3200.00,
                currency: 'GHS',
            };
        }
        console.error('Error fetching wallet balance:', error);
        throw error;
    }
}

/**
 * Fetch wallet transaction history
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
    } catch (error) {
        if (__DEV__) {
            console.warn('[Dev] Using mock transactions (API unreachable)');
            return [
                { id: '1', userId, type: 'trip_payment', description: 'Tow - Toyota Camry', createdAt: new Date().toISOString(), amount: 150.00, currency: 'GHS', status: 'completed' },
                { id: '2', userId, type: 'trip_payment', description: 'Tow - Ford Ranger', createdAt: new Date(Date.now() - 3600000).toISOString(), amount: 200.00, currency: 'GHS', status: 'completed' },
                { id: '3', userId, type: 'withdrawal', description: 'Withdrawal to MTN MoMo', createdAt: new Date(Date.now() - 86400000).toISOString(), amount: -500.00, currency: 'GHS', status: 'completed' },
                { id: '4', userId, type: 'trip_payment', description: 'Tow - Honda Civic', createdAt: new Date(Date.now() - 90000000).toISOString(), amount: 120.00, currency: 'GHS', status: 'completed' },
                { id: '5', userId, type: 'bonus', description: 'Weekly Activity Bonus', createdAt: new Date(Date.now() - 172800000).toISOString(), amount: 50.00, currency: 'GHS', status: 'completed' },
            ];
        }
        console.error('Error fetching transactions:', error);
        return [];
    }
}

/**
 * Request a withdrawal (e.g. via Mobile Money)
 */
export async function requestWithdrawal(
    userId: string,
    amount: number,
    details: { provider: string; phoneNumber: string; accountName?: string }
): Promise<WalletTransaction> {
    try {
        const response = await api.post<WalletTransaction>('/wallet/withdraw', {
            userId,
            amount,
            ...details
        });

        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Withdrawal failed');
    } catch (error) {
        if (__DEV__) {
            console.warn('[Dev] Simulating successful withdrawal (API unreachable)');
            return {
                id: `wd-${Date.now()}`,
                userId,
                type: 'withdrawal',
                amount: -amount,
                currency: 'GHS',
                status: 'pending',
                description: `Withdrawal to ${details.provider}`,
                createdAt: new Date().toISOString()
            };
        }
        console.error('Error requesting withdrawal:', error);
        throw error;
    }
}
