/**
 * Receipt Service
 * Handles generating and formatting receipts for completed towing requests
 */

import { getSupabaseAdmin } from '../config/database';
import { createError } from '../middleware/error.middleware';
import * as requestsService from './requests.service';
import logger from '../utils/logger';

export interface ReceiptData {
  requestId: string;
  receiptNumber: string;
  date: string;
  customer: {
    name: string;
    phone: string;
  };
  operator: {
    name: string;
    phone: string;
  } | null;
  pickupAddress: string;
  destinationAddress: string;
  distanceKm: number;
  vehicleType: string;
  estimatedPrice: number;
  finalPrice: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Generate receipt data for a completed request
 */
export async function generateReceiptData(
  requestId: string,
  userId: string
): Promise<ReceiptData> {
  const supabase = getSupabaseAdmin();

  // Get request with details
  const request = await requestsService.getRequestWithDetails(requestId);

  // Verify user has access to this request
  if (request.userId !== userId && request.operatorId !== userId) {
    throw createError.forbidden('You do not have access to this receipt');
  }

  // Only generate receipts for completed requests
  if (request.status !== 'completed') {
    throw createError.badRequest('Receipt can only be generated for completed requests');
  }

  // Generate receipt number (format: TWM-YYYYMMDD-XXXX)
  const date = new Date(request.completedAt || request.createdAt);
  const receiptNumber = `TWM-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${requestId.substring(0, 4).toUpperCase()}`;

  return {
    requestId: request.id,
    receiptNumber,
    date: date.toISOString(),
    customer: {
      name: request.user?.fullName || 'N/A',
      phone: request.user?.phone || 'N/A',
    },
    operator: request.operator ? {
      name: request.operator.fullName,
      phone: request.operator.phone,
    } : null,
    pickupAddress: request.pickupAddress,
    destinationAddress: request.destinationAddress,
    distanceKm: request.distanceKm,
    vehicleType: request.vehicleType,
    estimatedPrice: request.estimatedPrice,
    finalPrice: request.finalPrice,
    status: request.status,
    createdAt: request.createdAt,
    completedAt: request.completedAt,
  };
}

/**
 * Format receipt data as plain text
 */
export function formatReceiptAsText(data: ReceiptData): string {
  const lines: string[] = [];
  
  // Header
  lines.push('='.repeat(50));
  lines.push('           TOWME TOWING SERVICE');
  lines.push('='.repeat(50));
  lines.push('');
  
  // Receipt info
  lines.push(`Receipt Number: ${data.receiptNumber}`);
  lines.push(`Date: ${new Date(data.date).toLocaleString()}`);
  lines.push(`Request ID: ${data.requestId}`);
  lines.push('');
  lines.push('-'.repeat(50));
  lines.push('');
  
  // Customer info
  lines.push('CUSTOMER INFORMATION:');
  lines.push(`  Name: ${data.customer.name}`);
  lines.push(`  Phone: ${data.customer.phone}`);
  lines.push('');
  
  // Operator info
  if (data.operator) {
    lines.push('OPERATOR INFORMATION:');
    lines.push(`  Name: ${data.operator.name}`);
    lines.push(`  Phone: ${data.operator.phone}`);
    lines.push('');
  }
  
  // Service details
  lines.push('SERVICE DETAILS:');
  lines.push(`  Pickup: ${data.pickupAddress}`);
  lines.push(`  Destination: ${data.destinationAddress}`);
  lines.push(`  Distance: ${data.distanceKm.toFixed(2)} km`);
  lines.push(`  Vehicle Type: ${data.vehicleType}`);
  lines.push('');
  lines.push('-'.repeat(50));
  lines.push('');
  
  // Pricing
  lines.push('PRICING:');
  lines.push(`  Estimated Price: $${data.estimatedPrice.toFixed(2)}`);
  if (data.finalPrice !== null) {
    lines.push(`  Final Price: $${data.finalPrice.toFixed(2)}`);
    if (data.finalPrice !== data.estimatedPrice) {
      const difference = data.finalPrice - data.estimatedPrice;
      lines.push(`  Adjustment: ${difference >= 0 ? '+' : ''}$${difference.toFixed(2)}`);
    }
  } else {
    lines.push(`  Final Price: Pending`);
  }
  lines.push('');
  lines.push('-'.repeat(50));
  lines.push('');
  
  // Timestamps
  lines.push('TIMELINE:');
  lines.push(`  Created: ${new Date(data.createdAt).toLocaleString()}`);
  if (data.completedAt) {
    lines.push(`  Completed: ${new Date(data.completedAt).toLocaleString()}`);
  }
  lines.push(`  Status: ${data.status.toUpperCase()}`);
  lines.push('');
  
  // Footer
  lines.push('='.repeat(50));
  lines.push('Thank you for using TowMe!');
  lines.push('='.repeat(50));
  
  return lines.join('\n');
}

/**
 * Generate receipt as PDF (placeholder for future implementation)
 * TODO: Implement PDF generation using a library like pdfkit
 */
export async function generateReceiptAsPDF(
  data: ReceiptData
): Promise<Buffer> {
  // TODO: Implement PDF generation
  logger.warn('PDF receipt generation not yet implemented');
  throw createError.internal('PDF receipt generation not yet implemented');
}

