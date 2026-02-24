/**
 * Shared TypeScript interfaces for the SmartHelp app.
 */

/** User profile stored in Firebase RTDB at /users/{uid} */
export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  fcmToken: string | null;
  online: boolean;
  lastSeen: number;
}

/** Call record stored in Firebase RTDB at /calls/{channelId} */
export interface CallRecord {
  channelId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string | null;
  calleeId: string;
  calleeName: string;
  calleePhoto?: string | null;
  status: CallStatus;
  type: 'video' | 'audio';
  createdAt: number;
  acceptedAt?: number;
  endedAt?: number;
  duration?: number; // seconds
}

export type CallStatus =
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'missed'
  | 'ended'
  | 'cancelled';

/** Call history entry stored at /callHistory/{uid}/{callId} */
export interface CallHistoryEntry {
  channelId: string;
  otherUserId: string;
  otherUserName: string;
  direction: 'incoming' | 'outgoing';
  status: CallStatus;
  type: 'video' | 'audio';
  duration: number; // seconds
  timestamp: number;
}

/** Incoming call notification payload */
export interface IncomingCallPayload {
  channelId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string | null;
  calleeId?: string;
  calleeName?: string;
  calleePhoto?: string | null;
  status?: CallStatus;
  type: 'video' | 'audio';
  createdAt?: number;
}
