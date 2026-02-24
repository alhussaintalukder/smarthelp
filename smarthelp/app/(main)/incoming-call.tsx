/**
 * Incoming call screen — accept or reject.
 */

import React, { useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';

import { IncomingCallUI } from '@/components/call/IncomingCallUI';
import { useAppSelector, useAppDispatch } from '@/store';
import { resetCallState, setCallConnected } from '@/store/slices/callSlice';
import { clearIncomingCallNotification } from '@/store/slices/notificationSlice';
import {
  acceptCall as acceptCallService,
  rejectCall as rejectCallService,
  subscribeToCallStatus,
} from '@/services/callService';

export default function IncomingCallScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentCall = useAppSelector((s) => s.call.currentCall);
  const incomingCall = useAppSelector((s) => s.notification.incomingCall);

  const channelId = currentCall?.channelId ?? incomingCall?.channelId;

  const handleAccept = useCallback(async () => {
    if (!channelId) return;
    try {
      await acceptCallService(channelId);
      dispatch(clearIncomingCallNotification());
      dispatch(setCallConnected());
      router.replace(`/(main)/call/${channelId}` as any);
    } catch {
      dispatch(resetCallState());
      dispatch(clearIncomingCallNotification());
      if (router.canGoBack()) router.back();
    }
  }, [channelId, dispatch, router]);

  const handleReject = useCallback(async () => {
    if (channelId) {
      try {
        await rejectCallService(channelId);
      } catch {}
    }
    dispatch(clearIncomingCallNotification());
    dispatch(resetCallState());
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/(tabs)/home' as any);
    }
  }, [channelId, dispatch, router]);

  // Watch for caller cancellation
  useEffect(() => {
    if (!channelId) return;

    const unsubscribe = subscribeToCallStatus(channelId, (callRecord) => {
      const status = callRecord?.status;
      if (status === 'cancelled' || status === 'ended' || status === 'missed') {
        dispatch(clearIncomingCallNotification());
        dispatch(resetCallState());
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(main)/(tabs)/home' as any);
        }
      }
    });

    return unsubscribe;
  }, [channelId, router, dispatch]);

  // Back button = reject
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleReject();
      return true;
    });
    return () => handler.remove();
  }, [channelId, handleReject]);

  const callerName =
    currentCall?.callerName ?? incomingCall?.callerName ?? 'Unknown';
  const callerPhoto =
    currentCall?.callerPhoto ?? incomingCall?.callerPhoto ?? undefined;

  return (
    <IncomingCallUI
      callerName={callerName}
      callerPhotoURL={callerPhoto}
      onAccept={handleAccept}
      onReject={handleReject}
    />
  );
}
