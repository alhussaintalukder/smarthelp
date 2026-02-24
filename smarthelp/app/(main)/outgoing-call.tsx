/**
 * Outgoing call screen — shown while ringing the callee.
 */

import React, { useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';

import { OutgoingCallUI } from '@/components/call/OutgoingCallUI';
import { useAppSelector, useAppDispatch } from '@/store';
import { resetCallState } from '@/store/slices/callSlice';
import { cancelCall as cancelCallService, subscribeToCallStatus } from '@/services/callService';

export default function OutgoingCallScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentCall = useAppSelector((s) => s.call.currentCall);

  const handleCancel = useCallback(async () => {
    if (currentCall?.channelId) {
      try {
        await cancelCallService(currentCall.channelId);
      } catch {}
    }
    dispatch(resetCallState());
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/(tabs)/home' as any);
    }
  }, [currentCall, dispatch, router]);

  // Listen to call status changes
  useEffect(() => {
    if (!currentCall?.channelId) return;

    const unsubscribe = subscribeToCallStatus(currentCall.channelId, (callRecord) => {
      const status = callRecord?.status;
      if (status === 'accepted') {
        // Navigate to active call screen
        router.replace(`/(main)/call/${currentCall.channelId}` as any);
      } else if (status === 'rejected' || status === 'missed' || status === 'ended') {
        dispatch(resetCallState());
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(main)/(tabs)/home' as any);
        }
      }
    });

    return unsubscribe;
  }, [currentCall?.channelId, router, dispatch]);

  // Handle back button — cancel the call
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });
    return () => handler.remove();
  }, [currentCall, handleCancel]);

  if (!currentCall) {
    return null;
  }

  return (
    <OutgoingCallUI
      calleeName={currentCall.calleeName ?? 'Unknown'}
      calleePhotoURL={currentCall.calleePhoto ?? undefined}
      onCancel={handleCancel}
    />
  );
}
