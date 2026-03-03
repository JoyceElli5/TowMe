/**
 * Stale Requests Background Job
 * Periodically scans for and auto-cancels stale towing requests.
 * 
 * - Pending requests older than 15 minutes → cancelled
 * - Accepted/in_progress requests older than 6 hours → cancelled
 * 
 * Runs every 5 minutes via setInterval, started from server.ts.
 */

import { REQUEST_STATUS } from '../config/constants';
import { getSupabaseAdmin } from '../config/database';
import logger from '../utils/logger';

const PENDING_TIMEOUT_MS = 15 * 60 * 1000;      // 15 minutes
const ACTIVE_TIMEOUT_MS = 6 * 60 * 60 * 1000;   // 6 hours
const CRON_INTERVAL_MS = 5 * 60 * 1000;          // 5 minutes

async function cancelStaleRequests(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date();

  try {
    // 1. Cancel stale pending requests (> 15 minutes old)
    const pendingCutoff = new Date(now.getTime() - PENDING_TIMEOUT_MS).toISOString();

    const { data: stalePending, error: pendingError } = await supabase
      .from('towing_requests')
      .update({
        status: REQUEST_STATUS.CANCELLED,
        cancellation_reason: 'Auto-cancelled: no operator accepted within 15 minutes',
        updated_at: now.toISOString(),
      })
      .eq('status', REQUEST_STATUS.PENDING)
      .lt('created_at', pendingCutoff)
      .select('id');

    if (pendingError) {
      logger.error('Error cancelling stale pending requests:', pendingError);
    } else if (stalePending && stalePending.length > 0) {
      logger.info(
        { count: stalePending.length, ids: stalePending.map(r => r.id) },
        'Auto-cancelled stale pending requests'
      );
    }

    // 2. Cancel stale accepted/in_progress requests (> 6 hours old)
    const activeCutoff = new Date(now.getTime() - ACTIVE_TIMEOUT_MS).toISOString();

    const { data: staleActive, error: activeError } = await supabase
      .from('towing_requests')
      .update({
        status: REQUEST_STATUS.CANCELLED,
        cancellation_reason: 'Auto-cancelled: request exceeded 6-hour time limit',
        updated_at: now.toISOString(),
      })
      .in('status', [REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.IN_PROGRESS])
      .lt('created_at', activeCutoff)
      .select('id');

    if (activeError) {
      logger.error('Error cancelling stale active requests:', activeError);
    } else if (staleActive && staleActive.length > 0) {
      logger.info(
        { count: staleActive.length, ids: staleActive.map(r => r.id) },
        'Auto-cancelled stale active requests'
      );
    }
  } catch (error) {
    logger.error('Unexpected error in stale requests cron:', error);
  }
}

let intervalId: NodeJS.Timeout | null = null;

/**
 * Start the background job that periodically cancels stale requests.
 * Safe to call multiple times; will not start duplicate intervals.
 */
export function startStaleRequestsCron(): void {
  if (intervalId) {
    logger.warn('Stale requests cron is already running');
    return;
  }

  logger.info(`Starting stale requests cron (interval: ${CRON_INTERVAL_MS / 1000}s)`);

  // Run once immediately on startup
  cancelStaleRequests();

  // Then run on interval
  intervalId = setInterval(cancelStaleRequests, CRON_INTERVAL_MS);
}

/**
 * Stop the background job. Useful for graceful shutdown.
 */
export function stopStaleRequestsCron(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Stale requests cron stopped');
  }
}
