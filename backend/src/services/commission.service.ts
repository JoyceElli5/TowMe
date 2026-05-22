/**
 * Commission Service
 * Handles TowMe platform commission calculation, wallet management,
 * operator debt tracking, and suspension logic.
 */

import { getSupabaseAdmin } from '../config/database';
import { COMMISSION_RATE, COMMISSION_SUSPENSION_THRESHOLD } from '../config/constants';
import { createError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export interface OperatorWallet {
  operator_id: string;
  total_earnings: number;
  total_commission_owed: number;
  total_commission_paid: number;
  current_outstanding_balance: number;
  withdrawable_balance: number;
  updated_at: string;
}

export interface CommissionPayment {
  id: string;
  operator_id: string;
  amount_paid: number;
  payment_method: string;
  transaction_reference: string | null;
  verified_by_admin: boolean;
  admin_notes: string | null;
  created_at: string;
}

/**
 * Record commission for a completed trip.
 * Called automatically when a trip status changes to 'completed'.
 */
export async function recordTripCommission(
  requestId: string,
  operatorId: string,
  fareAmount: number
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const commissionAmount = Math.round(fareAmount * COMMISSION_RATE * 100) / 100;
  const netOperatorAmount = Math.round((fareAmount - commissionAmount) * 100) / 100;

  // Update the trip with commission breakdown
  const { error: tripError } = await supabase
    .from('towing_requests')
    .update({
      commission_percentage: COMMISSION_RATE * 100,
      commission_amount: commissionAmount,
      net_operator_amount: netOperatorAmount,
    })
    .eq('id', requestId);

  if (tripError) {
    logger.error('Failed to update trip commission:', tripError);
  }

  // Upsert operator wallet — create if not exists, else increment
  const { data: existing } = await supabase
    .from('operator_wallets')
    .select('*')
    .eq('operator_id', operatorId)
    .single();

  if (existing) {
    const newOutstanding = existing.current_outstanding_balance + commissionAmount;
    const { error } = await supabase
      .from('operator_wallets')
      .update({
        total_earnings: existing.total_earnings + fareAmount,
        total_commission_owed: existing.total_commission_owed + commissionAmount,
        current_outstanding_balance: newOutstanding,
        withdrawable_balance: existing.withdrawable_balance + netOperatorAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('operator_id', operatorId);
    if (error) logger.error('Failed to update operator wallet:', error);
  } else {
    const { error } = await supabase
      .from('operator_wallets')
      .insert({
        operator_id: operatorId,
        total_earnings: fareAmount,
        total_commission_owed: commissionAmount,
        total_commission_paid: 0,
        current_outstanding_balance: commissionAmount,
        withdrawable_balance: netOperatorAmount,
        updated_at: new Date().toISOString(),
      });
    if (error) logger.error('Failed to create operator wallet:', error);
  }

  logger.info(
    { requestId, operatorId, fare: fareAmount, commission: commissionAmount },
    'Commission recorded'
  );
}

/**
 * Get operator wallet (creates a zero-balance wallet if none exists).
 */
export async function getOperatorWallet(operatorId: string): Promise<OperatorWallet> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('operator_wallets')
    .select('*')
    .eq('operator_id', operatorId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to fetch operator wallet:', error);
    throw createError.internal('Failed to fetch wallet');
  }

  if (!data) {
    return {
      operator_id: operatorId,
      total_earnings: 0,
      total_commission_owed: 0,
      total_commission_paid: 0,
      current_outstanding_balance: 0,
      withdrawable_balance: 0,
      updated_at: new Date().toISOString(),
    };
  }

  return data as OperatorWallet;
}

/**
 * Check if operator is suspended due to unpaid commission.
 */
export async function isOperatorSuspended(operatorId: string): Promise<{
  suspended: boolean;
  outstandingBalance: number;
  threshold: number;
}> {
  const wallet = await getOperatorWallet(operatorId);
  const suspended = wallet.current_outstanding_balance >= COMMISSION_SUSPENSION_THRESHOLD;
  return {
    suspended,
    outstandingBalance: wallet.current_outstanding_balance,
    threshold: COMMISSION_SUSPENSION_THRESHOLD,
  };
}

/**
 * Admin: Record a commission payment (settle operator debt).
 */
export async function recordCommissionPayment(
  operatorId: string,
  amountPaid: number,
  paymentMethod: string,
  transactionReference?: string,
  adminNotes?: string
): Promise<CommissionPayment> {
  const supabase = getSupabaseAdmin();

  const wallet = await getOperatorWallet(operatorId);

  const appliedAmount = Math.min(amountPaid, wallet.current_outstanding_balance);

  // Insert payment record
  const { data: payment, error: paymentError } = await supabase
    .from('commission_payments')
    .insert({
      operator_id: operatorId,
      amount_paid: appliedAmount,
      payment_method: paymentMethod,
      transaction_reference: transactionReference ?? null,
      verified_by_admin: true,
      admin_notes: adminNotes ?? null,
    })
    .select()
    .single();

  if (paymentError || !payment) {
    logger.error('Failed to insert commission payment:', paymentError);
    throw createError.internal('Failed to record commission payment');
  }

  // Update wallet balance
  const { error: walletError } = await supabase
    .from('operator_wallets')
    .update({
      total_commission_paid: wallet.total_commission_paid + appliedAmount,
      current_outstanding_balance: Math.max(0, wallet.current_outstanding_balance - appliedAmount),
      updated_at: new Date().toISOString(),
    })
    .eq('operator_id', operatorId);

  if (walletError) {
    logger.error('Failed to update wallet after payment:', walletError);
  }

  logger.info({ operatorId, amountPaid: appliedAmount }, 'Commission payment recorded');

  return payment as CommissionPayment;
}

/**
 * Admin: List all commission payments for an operator.
 */
export async function getCommissionPayments(operatorId: string): Promise<CommissionPayment[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('commission_payments')
    .select('*')
    .eq('operator_id', operatorId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch commission payments:', error);
    throw createError.internal('Failed to fetch commission payments');
  }

  return (data || []) as CommissionPayment[];
}

/**
 * Get commission summary across all operators (for admin dashboard).
 */
export async function getCommissionSummary(): Promise<{
  totalOperators: number;
  totalCommissionOwed: number;
  totalCommissionPaid: number;
  totalOutstanding: number;
  suspendedOperators: number;
}> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('operator_wallets')
    .select('total_commission_owed, total_commission_paid, current_outstanding_balance');

  if (error) {
    logger.error('Failed to fetch commission summary:', error);
    throw createError.internal('Failed to fetch commission summary');
  }

  const wallets = data || [];
  return {
    totalOperators: wallets.length,
    totalCommissionOwed: wallets.reduce((s, w) => s + w.total_commission_owed, 0),
    totalCommissionPaid: wallets.reduce((s, w) => s + w.total_commission_paid, 0),
    totalOutstanding: wallets.reduce((s, w) => s + w.current_outstanding_balance, 0),
    suspendedOperators: wallets.filter(w => w.current_outstanding_balance >= COMMISSION_SUSPENSION_THRESHOLD).length,
  };
}
