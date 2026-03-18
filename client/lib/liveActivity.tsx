/**
 * TowMe Live Activity
 *
 * Shows tow trip status on the iOS lock screen and Dynamic Island.
 * Uses Voltra (https://use-voltra.dev) — iOS 16.2+ only.
 *
 * Flow:
 *   startTowLiveActivity()  → operator accepted request
 *   updateTowLiveActivity() → status changed (in_progress)
 *   endTowLiveActivity()    → trip completed
 */

import React from 'react';
import { Platform } from 'react-native';

// Activity ID stored in memory (one active trip at a time)
let _activityId: string | null = null;

export type TowStatus = 'accepted' | 'in_progress' | 'completed';

interface TowActivityData {
  requestId: string;
  operatorName: string;
  pickupAddress: string;
  destinationAddress: string;
  status: TowStatus;
}

function statusLabel(status: TowStatus): string {
  switch (status) {
    case 'accepted':   return 'Operator on the way';
    case 'in_progress': return 'Towing in progress';
    case 'completed':  return 'Trip complete';
  }
}

function statusIcon(status: TowStatus): string {
  switch (status) {
    case 'accepted':    return 'truck.fill';
    case 'in_progress': return 'arrow.triangle.swap';
    case 'completed':   return 'checkmark.circle.fill';
  }
}

function statusColor(status: TowStatus): string {
  switch (status) {
    case 'accepted':    return '#003554';
    case 'in_progress': return '#f59e0b';
    case 'completed':   return '#22c55e';
  }
}

/** Build the Voltra variants JSX for a given tow status */
function buildVariants(data: TowActivityData) {
  // Import Voltra lazily so the module doesn't crash on Android
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Voltra } = require('voltra') as typeof import('voltra');

  const label = statusLabel(data.status);
  const icon  = statusIcon(data.status);
  const color = statusColor(data.status);

  return {
    /** Lock screen banner */
    lockScreen: (
      <Voltra.VStack
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: '#001f33',
          gap: 6,
        }}
      >
        <Voltra.HStack style={{ gap: 8, alignItems: 'center' }}>
          <Voltra.Symbol name={icon} tintColor={color} size={20} />
          <Voltra.Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            TowMe
          </Voltra.Text>
        </Voltra.HStack>

        <Voltra.Text style={{ color: color, fontSize: 14, fontWeight: '500' }}>
          {label}
        </Voltra.Text>

        <Voltra.Text style={{ color: '#94a3b8', fontSize: 12 }}>
          {data.operatorName}
        </Voltra.Text>

        <Voltra.HStack style={{ gap: 4, alignItems: 'center', marginTop: 4 }}>
          <Voltra.Symbol name="arrow.right" tintColor="#64748b" size={10} />
          <Voltra.Text style={{ color: '#64748b', fontSize: 11 }} numberOfLines={1}>
            {data.destinationAddress}
          </Voltra.Text>
        </Voltra.HStack>
      </Voltra.VStack>
    ),

    /** Dynamic Island compact leading slot (left of camera) */
    compact: (
      <Voltra.HStack style={{ gap: 4, alignItems: 'center' }}>
        <Voltra.Symbol name="truck.fill" tintColor={color} size={14} />
        <Voltra.Text style={{ color: '#fff', fontSize: 12 }}>{label}</Voltra.Text>
      </Voltra.HStack>
    ),

    /** Dynamic Island minimal (only icon when space is very tight) */
    minimal: (
      <Voltra.Symbol name={icon} tintColor={color} size={16} />
    ),

    /** Dynamic Island expanded (user long-presses Dynamic Island) */
    expanded: (
      <Voltra.VStack style={{ padding: 12, gap: 8 }}>
        <Voltra.HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Voltra.HStack style={{ gap: 6, alignItems: 'center' }}>
            <Voltra.Symbol name={icon} tintColor={color} size={18} />
            <Voltra.Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
              {label}
            </Voltra.Text>
          </Voltra.HStack>
          <Voltra.Text style={{ color: '#94a3b8', fontSize: 12 }}>TowMe</Voltra.Text>
        </Voltra.HStack>

        <Voltra.VStack style={{ gap: 4 }}>
          <Voltra.HStack style={{ gap: 6, alignItems: 'center' }}>
            <Voltra.Symbol name="location.fill" tintColor="#22c55e" size={12} />
            <Voltra.Text style={{ color: '#cbd5e1', fontSize: 12 }} numberOfLines={1}>
              {data.pickupAddress}
            </Voltra.Text>
          </Voltra.HStack>
          <Voltra.HStack style={{ gap: 6, alignItems: 'center' }}>
            <Voltra.Symbol name="flag.fill" tintColor="#ef4444" size={12} />
            <Voltra.Text style={{ color: '#cbd5e1', fontSize: 12 }} numberOfLines={1}>
              {data.destinationAddress}
            </Voltra.Text>
          </Voltra.HStack>
        </Voltra.VStack>

        <Voltra.Text style={{ color: '#64748b', fontSize: 11 }}>
          Operator: {data.operatorName}
        </Voltra.Text>
      </Voltra.VStack>
    ),
  };
}

/**
 * Start the Live Activity when an operator accepts the request.
 */
export async function startTowLiveActivity(data: TowActivityData): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const { startLiveActivity } = await import('voltra/client');
    const variants = buildVariants(data);
    _activityId = await startLiveActivity(variants, {
      activityId: `tow-${data.requestId}`,
      deepLinkUrl: `towme://request/${data.requestId}`,
      dismissalPolicy: { after: 3600 }, // auto-dismiss after 1 hour if not ended
      relevanceScore: 1.0,
    });
  } catch (err) {
    // Non-fatal: app works fine without Live Activity
    console.warn('[LiveActivity] Failed to start:', err);
  }
}

/**
 * Update the Live Activity when the trip status changes.
 */
export async function updateTowLiveActivity(data: TowActivityData): Promise<void> {
  if (Platform.OS !== 'ios' || !_activityId) return;
  try {
    const { updateLiveActivity } = await import('voltra/client');
    const variants = buildVariants(data);
    await updateLiveActivity(_activityId, variants, {
      relevanceScore: data.status === 'in_progress' ? 0.9 : 0.8,
    });
  } catch (err) {
    console.warn('[LiveActivity] Failed to update:', err);
  }
}

/**
 * End the Live Activity when the trip is complete.
 */
export async function endTowLiveActivity(): Promise<void> {
  if (Platform.OS !== 'ios' || !_activityId) return;
  try {
    const { stopLiveActivity } = await import('voltra/client');
    await stopLiveActivity(_activityId, {
      dismissalPolicy: { after: 30 }, // linger for 30s so user sees "completed"
    });
    _activityId = null;
  } catch (err) {
    console.warn('[LiveActivity] Failed to end:', err);
  }
}
