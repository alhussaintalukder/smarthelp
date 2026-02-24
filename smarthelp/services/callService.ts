/**
 * Call signaling service — Firebase RTDB for call signaling.
 *
 * Agora handles media transport. This service handles:
 * - Creating call records
 * - Listening for call status changes
 * - Updating call status (accept, reject, end, cancel)
 * - Saving call history
 */

import {
  ref,
  set,
  update,
  onValue,
  off,

  get,
  DataSnapshot,
} from 'firebase/database';

import { getFirebaseDatabase } from './firebase';
import { DB_PATHS } from '@/constants/firebase';
import type {
  CallRecord,
  CallHistoryEntry,
  CallStatus,
  User,
} from '@/types';

/** UUID v4 generator using Math.random (crypto.getRandomValues not available in Hermes) */
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Initiate a call — write call record to /calls/{channelId}.
 * Returns the channelId for the new call.
 */
export async function initiateCall(
  caller: User,
  callee: User,
  type: 'video' | 'audio' = 'video'
): Promise<string> {
  const db = getFirebaseDatabase();
  const channelId = uuidv4();

  const callRecord: CallRecord = {
    channelId,
    callerId: caller.uid ?? '',
    callerName: caller.displayName ?? '',
    callerPhoto: caller.photoURL ?? null,
    calleeId: callee.uid ?? '',
    calleeName: callee.displayName ?? '',
    calleePhoto: callee.photoURL ?? null,
    status: 'ringing',
    type,
    createdAt: Date.now(),
  };

  await set(ref(db, `${DB_PATHS.CALLS}/${channelId}`), callRecord);
  return channelId;
}

/**
 * Accept an incoming call.
 */
export async function acceptCall(channelId: string): Promise<void> {
  const db = getFirebaseDatabase();
  await update(ref(db, `${DB_PATHS.CALLS}/${channelId}`), {
    status: 'accepted' as CallStatus,
    acceptedAt: Date.now(),
  });
}

/**
 * Reject an incoming call.
 */
export async function rejectCall(channelId: string): Promise<void> {
  const db = getFirebaseDatabase();
  await update(ref(db, `${DB_PATHS.CALLS}/${channelId}`), {
    status: 'rejected' as CallStatus,
    endedAt: Date.now(),
  });
}

/**
 * Cancel an outgoing call (caller hangs up before answer).
 */
export async function cancelCall(channelId: string): Promise<void> {
  const db = getFirebaseDatabase();
  await update(ref(db, `${DB_PATHS.CALLS}/${channelId}`), {
    status: 'cancelled' as CallStatus,
    endedAt: Date.now(),
  });
}

/**
 * Mark a call as missed (timeout with no answer).
 */
export async function missCall(channelId: string): Promise<void> {
  const db = getFirebaseDatabase();
  await update(ref(db, `${DB_PATHS.CALLS}/${channelId}`), {
    status: 'missed' as CallStatus,
    endedAt: Date.now(),
  });
}

/**
 * End an ongoing call.
 */
export async function endCall(
  channelId: string,
  duration: number
): Promise<void> {
  const db = getFirebaseDatabase();
  await update(ref(db, `${DB_PATHS.CALLS}/${channelId}`), {
    status: 'ended' as CallStatus,
    endedAt: Date.now(),
    duration,
  });
}

/**
 * Subscribe to a call record's status changes.
 * Returns an unsubscribe function.
 */
export function subscribeToCallStatus(
  channelId: string,
  callback: (call: CallRecord | null) => void
): () => void {
  const db = getFirebaseDatabase();
  const callRef = ref(db, `${DB_PATHS.CALLS}/${channelId}`);

  onValue(callRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as CallRecord);
    } else {
      callback(null);
    }
  });

  return () => off(callRef);
}

/**
 * Subscribe to incoming calls for a specific user.
 * Listens on /calls and filters by calleeId + status === 'ringing'.
 */
export function subscribeToIncomingCalls(
  userId: string,
  callback: (call: CallRecord) => void
): () => void {
  const db = getFirebaseDatabase();
  const callsRef = ref(db, DB_PATHS.CALLS);

  onValue(callsRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) return;

    const calls = snapshot.val() as Record<string, CallRecord>;
    for (const channelId of Object.keys(calls)) {
      const call = calls[channelId];
      if (call.calleeId === userId && call.status === 'ringing') {
        callback(call);
        break; // Only handle one incoming call at a time
      }
    }
  });

  return () => off(callsRef);
}

/**
 * Save a call to the call history for both users.
 */
export async function saveCallHistory(call: CallRecord): Promise<void> {
  const db = getFirebaseDatabase();
  const duration = call.duration ?? 0;

  // Entry for the caller
  const callerEntry: CallHistoryEntry = {
    channelId: call.channelId,
    otherUserId: call.calleeId,
    otherUserName: call.calleeName,
    direction: 'outgoing',
    status: call.status,
    type: call.type,
    duration,
    timestamp: call.createdAt,
  };

  // Entry for the callee
  const calleeEntry: CallHistoryEntry = {
    channelId: call.channelId,
    otherUserId: call.callerId,
    otherUserName: call.callerName,
    direction: 'incoming',
    status: call.status,
    type: call.type,
    duration,
    timestamp: call.createdAt,
  };

  const callerHistoryRef = ref(
    db,
    `${DB_PATHS.CALL_HISTORY}/${call.callerId}/${call.channelId}`
  );
  const calleeHistoryRef = ref(
    db,
    `${DB_PATHS.CALL_HISTORY}/${call.calleeId}/${call.channelId}`
  );

  await Promise.all([
    set(callerHistoryRef, callerEntry),
    set(calleeHistoryRef, calleeEntry),
  ]);
}

/**
 * Get a call record by channelId.
 */
export async function getCallRecord(
  channelId: string
): Promise<CallRecord | null> {
  const db = getFirebaseDatabase();
  const snapshot = await get(ref(db, `${DB_PATHS.CALLS}/${channelId}`));
  return snapshot.exists() ? (snapshot.val() as CallRecord) : null;
}
