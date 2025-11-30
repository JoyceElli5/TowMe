/**
 * Payments Service
 * Handles pricing calculations and payment processing
 */

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '../config/database';
import { CURRENCY_SYMBOL, REQUEST_STATUS, BASE_PRICE_PER_KM } from '../config/constants';
import { createError } from '../middleware/error.middleware';
import { calculateDistance } from '../utils/distance.calculator';
import { calculateEstimatedPrice, getVehicleMultiplier } from '../utils/price.calculator';
import type {
  PriceEstimateRequest,
  PriceEstimateResponse,
  CreatePaymentRequest,
  PaymentResponse,
} from '../types/api.types';
import type { Payment, VehicleType } from '../types/database.types';
import logger from '../utils/logger';

/**
 * Get price estimate for a trip
 */
export function getPriceEstimate(data: PriceEstimateRequest): PriceEstimateResponse {
  const distanceKm = calculateDistance(
    data.pickupLat,
    data.pickupLng,
    data.destinationLat,
    data.destinationLng
  );

  const estimatedPrice = calculateEstimatedPrice(distanceKm, data.vehicleType);
  const vehicleMultiplier = getVehicleMultiplier(data.vehicleType);

  return {
    distanceKm,
    basePrice: BASE_PRICE_PER_KM,
    vehicleMultiplier,
    estimatedPrice,
    currency: CURRENCY_SYMBOL,
  };
}

/**
 * Process a payment
 */
export async function processPayment(
  userId: string,
  data: CreatePaymentRequest
): Promise<Payment> {
  const supabase = getSupabaseAdmin();

  // Get request
  const { data: request } = await supabase
    .from('towing_requests')
    .select('*')
    .eq('id', data.requestId)
    .single();

  if (!request) {
    throw createError.notFound('Request not found');
  }

  // Verify user is the requester
  if (request.user_id !== userId) {
    throw createError.forbidden('You cannot pay for this request');
  }

  // Verify request is completed
  if (request.status !== REQUEST_STATUS.COMPLETED) {
    throw createError.conflict('Can only pay for completed requests');
  }

  if (!request.operator_id) {
    throw createError.conflict('Request has no assigned operator');
  }

  // Check if payment already exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('request_id', data.requestId)
    .single();

  if (existingPayment) {
    throw createError.conflict('Payment already exists for this request');
  }

  // Get the final price
  const amount = request.final_price || request.estimated_price;

  // Generate transaction reference
  const transactionReference = `TXN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  // Create payment record
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      id: uuidv4(),
      request_id: data.requestId,
      user_id: userId,
      operator_id: request.operator_id,
      amount,
      status: 'completed', // In a real app, this would be 'pending' until payment provider confirms
      payment_method: data.paymentMethod,
      transaction_reference: transactionReference,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating payment:', error);
    throw createError.internal('Failed to process payment');
  }

  return payment;
}

/**
 * Get payment details for a request
 */
export async function getPaymentByRequest(requestId: string): Promise<Payment | null> {
  const supabase = getSupabaseAdmin();

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error fetching payment:', error);
    throw createError.internal('Failed to fetch payment');
  }

  return payment || null;
}

/**
 * Get operator earnings
 */
export async function getOperatorEarnings(
  operatorId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalEarnings: number;
  completedTrips: number;
  averagePerTrip: number;
  currency: string;
}> {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('payments')
    .select('amount')
    .eq('operator_id', operatorId)
    .eq('status', 'completed');

  if (startDate) {
    query = query.gte('completed_at', startDate);
  }
  if (endDate) {
    query = query.lte('completed_at', endDate);
  }

  const { data: payments, error } = await query;

  if (error) {
    logger.error('Error fetching operator earnings:', error);
    throw createError.internal('Failed to fetch earnings');
  }

  const allPayments = payments || [];
  const totalEarnings = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedTrips = allPayments.length;
  const averagePerTrip = completedTrips > 0 ? totalEarnings / completedTrips : 0;

  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    completedTrips,
    averagePerTrip: Math.round(averagePerTrip * 100) / 100,
    currency: CURRENCY_SYMBOL,
  };
}

/**
 * Map database payment to API response format
 */
export function mapPaymentToResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    requestId: payment.request_id,
    userId: payment.user_id,
    operatorId: payment.operator_id,
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.payment_method,
    transactionReference: payment.transaction_reference,
    createdAt: payment.created_at,
    completedAt: payment.completed_at,
  };
}
