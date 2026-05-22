/**
 * Admin Service
 * Operator verification and admin-only operations.
 */

import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { sendOperatorApprovalEmail, sendOperatorRejectionEmail } from './email.service';
import {
  getOperatorWallet,
  recordCommissionPayment,
  getCommissionPayments,
  getCommissionSummary,
  isOperatorSuspended,
  type OperatorWallet,
  type CommissionPayment,
} from './commission.service';

export {
  getOperatorWallet,
  recordCommissionPayment,
  getCommissionPayments,
  getCommissionSummary,
  isOperatorSuspended,
  type OperatorWallet,
  type CommissionPayment,
};

export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface AdminOperatorFilters {
  status?: VerificationStatus;
  page?: number;
  limit?: number;
}

export interface AdminOperatorListItem {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  verification_status: string | null;
  profile_completed: boolean | null;
  average_rating: number;
  total_trips: number;
  is_online: boolean;
  created_at: string;
}

export interface AdminOperatorDetail extends AdminOperatorListItem {
  ghana_card_number: string | null;
  ghana_card_photo_url: string | null;
  drivers_license_number: string | null;
  drivers_license_photo_url: string | null;
  operator_photo_url: string | null;
  vehicle_registration_number: string | null;
  vehicle_registration_photo_url: string | null;
  insurance_policy_number: string | null;
  insurance_photo_url: string | null;
  updated_at: string;
}

export interface VerifyOperatorBody {
  status: 'approved' | 'rejected';
  reason?: string;
}

/**
 * List operators for admin (filter by verification status).
 */
export async function getOperatorsForAdmin(filters: AdminOperatorFilters): Promise<{
  data: AdminOperatorListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const supabase = getSupabaseAdmin();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, email, full_name, phone, role, verification_status, profile_completed, average_rating, total_trips, is_online, created_at', { count: 'exact' })
    .eq('role', 'tow_operator');

  if (filters.status) {
    query = query.eq('verification_status', filters.status);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: rows, error, count } = await query;

  if (error) {
    logger.error('Admin getOperators error:', error);
    throw createError.internal('Failed to fetch operators');
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: (rows || []) as AdminOperatorListItem[],
    pagination: { page, limit, total, totalPages },
  };
}

/**
 * Get single operator detail for admin (includes document URLs).
 */
export async function getOperatorByIdForAdmin(operatorId: string): Promise<AdminOperatorDetail> {
  const supabase = getSupabaseAdmin();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', operatorId)
    .eq('role', 'tow_operator')
    .single();

  if (error || !user) {
    throw createError.notFound('Operator not found');
  }

  return user as AdminOperatorDetail;
}

/**
 * Update operator verification status (approve/reject).
 */
export async function updateOperatorVerification(
  operatorId: string,
  body: VerifyOperatorBody
): Promise<AdminOperatorDetail> {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('users')
    .select('id, role, email, full_name')
    .eq('id', operatorId)
    .single();

  if (!existing || existing.role !== 'tow_operator') {
    throw createError.notFound('Operator not found');
  }

  const updates: Record<string, unknown> = {
    verification_status: body.status,
    updated_at: new Date().toISOString(),
  };
  // Optional: add verification_reason column to users table and set updates.verification_reason = body.reason

  const { data: updated, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', operatorId)
    .select()
    .single();

  if (error) {
    logger.error('Admin updateOperatorVerification error:', error);
    throw createError.internal('Failed to update verification');
  }

  // Send email notification to operator (non-blocking)
  try {
    if (body.status === 'approved') {
      await sendOperatorApprovalEmail(existing.email, existing.full_name);
    } else if (body.status === 'rejected') {
      await sendOperatorRejectionEmail(existing.email, existing.full_name, body.reason);
    }
  } catch (emailError) {
    logger.error('Failed to send operator verification email:', emailError);
  }

  return updated as AdminOperatorDetail;
}
