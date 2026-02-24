/**
 * Call hook — manages Agora engine lifecycle, call signaling, and call state.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  IRtcEngineEventHandler,
  ConnectionStateType,
  ConnectionChangedReasonType,
} from 'react-native-agora';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  setOutgoingCall,
  setCallConnected,
  setJoined,
  addRemoteUser,
  removeRemoteUser,
  toggleMute,
  toggleCamera,
  toggleSpeaker,
  incrementDuration,
  resetCallState,
} from '@/store/slices/callSlice';
import {
  requestCallPermissions,
  joinChannel,
  leaveChannel,
  muteLocalAudio,
  muteLocalVideo,
  switchCamera as switchCam,
  setSpeakerphone,
  registerEventHandler,
  unregisterEventHandler,
} from '@/services/agora';
import {
  initiateCall,
  acceptCall,
  rejectCall,
  cancelCall,
  endCall,
  missCall,
  saveCallHistory,
  getCallRecord,
} from '@/services/callService';
import type { User, CallRecord } from '@/types';

/**
 * Hook that manages the full call lifecycle.
 */
export function useCall() {
  const dispatch = useAppDispatch();
  const callState = useAppSelector((state) => state.call);
  const currentUser = useAppSelector((state) => state.auth.user);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventHandlerRef = useRef<IRtcEngineEventHandler | null>(null);

  // Register Agora event handlers
  useEffect(() => {
    const handler: IRtcEngineEventHandler = {
      onJoinChannelSuccess: (_connection, _elapsed) => {
        dispatch(setJoined(true));
      },
      onUserJoined: (_connection, remoteUid, _elapsed) => {
        dispatch(addRemoteUser(remoteUid));
      },
      onUserOffline: (_connection, remoteUid, _reason) => {
        dispatch(removeRemoteUser(remoteUid));
      },
      onError: (_err, _msg) => {
        console.error('Agora error:', _err, _msg);
      },
      onConnectionStateChanged: (
        _connection,
        state,
        reason
      ) => {
        if (
          state === ConnectionStateType.ConnectionStateDisconnected &&
          reason !== ConnectionChangedReasonType.ConnectionChangedLeaveChannel
        ) {
          console.warn('Agora connection lost, reason:', reason);
        }
      },
    };

    eventHandlerRef.current = handler;
    registerEventHandler(handler);

    return () => {
      if (eventHandlerRef.current) {
        unregisterEventHandler(eventHandlerRef.current);
      }
    };
  }, [dispatch]);

  // Duration timer
  useEffect(() => {
    if (callState.callStatus === 'connected' && callState.isJoined) {
      durationIntervalRef.current = setInterval(() => {
        dispatch(incrementDuration());
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [callState.callStatus, callState.isJoined, dispatch]);

  /**
   * Start an outgoing call to a contact.
   */
  const startCall = useCallback(
    async (callee: User) => {
      if (!currentUser) return null;

      const hasPermissions = await requestCallPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Camera and microphone permissions are needed for video calls.'
        );
        return null;
      }

      try {
        const channelId = await initiateCall(currentUser, callee);

        const callRecord: CallRecord = {
          channelId,
          callerId: currentUser.uid,
          callerName: currentUser.displayName,
          calleeId: callee.uid,
          calleeName: callee.displayName,
          status: 'ringing',
          type: 'video',
          createdAt: Date.now(),
        };

        dispatch(setOutgoingCall(callRecord));

        // Set a 30-second timeout for unanswered calls
        missTimeoutRef.current = setTimeout(async () => {
          await missCall(channelId);
        }, 30000);

        return channelId;
      } catch (error) {
        console.error('Failed to start call:', error);
        Alert.alert('Error', 'Failed to start the call. Please try again.');
        return null;
      }
    },
    [currentUser, dispatch]
  );

  /**
   * Accept an incoming call.
   */
  const handleAcceptCall = useCallback(
    async (channelId: string) => {
      try {
        await acceptCall(channelId);
        dispatch(setCallConnected());

        // Generate a numeric UID from the user's uid string
        const uid = currentUser
          ? Math.abs(hashCode(currentUser.uid)) % 100000
          : 0;

        await joinChannel(channelId, uid);
      } catch (error) {
        console.error('Failed to accept call:', error);
        dispatch(resetCallState());
      }
    },
    [currentUser, dispatch]
  );

  /**
   * Reject an incoming call.
   */
  const handleRejectCall = useCallback(
    async (channelId: string) => {
      try {
        await rejectCall(channelId);
        dispatch(resetCallState());
      } catch (error) {
        console.error('Failed to reject call:', error);
        dispatch(resetCallState());
      }
    },
    [dispatch]
  );

  /**
   * Cancel an outgoing call before it's answered.
   */
  const handleCancelCall = useCallback(
    async (channelId: string) => {
      try {
        if (missTimeoutRef.current) {
          clearTimeout(missTimeoutRef.current);
          missTimeoutRef.current = null;
        }
        await cancelCall(channelId);
        dispatch(resetCallState());
      } catch (error) {
        console.error('Failed to cancel call:', error);
        dispatch(resetCallState());
      }
    },
    [dispatch]
  );

  /**
   * End an active call.
   */
  const handleEndCall = useCallback(
    async (channelId: string) => {
      try {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        leaveChannel();

        // Get the call record to save history
        const callRecord = await getCallRecord(channelId);
        if (callRecord) {
          await endCall(channelId, callState.callDuration);
          await saveCallHistory({
            ...callRecord,
            status: 'ended',
            duration: callState.callDuration,
            endedAt: Date.now(),
          });
        }

        dispatch(resetCallState());
      } catch (error) {
        console.error('Failed to end call:', error);
        leaveChannel();
        dispatch(resetCallState());
      }
    },
    [callState.callDuration, dispatch]
  );

  /**
   * Join the Agora channel (called after call is accepted).
   */
  const handleJoinChannel = useCallback(
    async (channelId: string) => {
      const uid = currentUser
        ? Math.abs(hashCode(currentUser.uid)) % 100000
        : 0;
      await joinChannel(channelId, uid);
    },
    [currentUser]
  );

  /**
   * Toggle microphone mute.
   */
  const handleToggleMute = useCallback(() => {
    dispatch(toggleMute());
    muteLocalAudio(!callState.isMuted);
  }, [callState.isMuted, dispatch]);

  /**
   * Toggle camera on/off.
   */
  const handleToggleCamera = useCallback(() => {
    dispatch(toggleCamera());
    muteLocalVideo(!callState.isCameraOff);
  }, [callState.isCameraOff, dispatch]);

  /**
   * Toggle speakerphone.
   */
  const handleToggleSpeaker = useCallback(() => {
    dispatch(toggleSpeaker());
    setSpeakerphone(!callState.isSpeakerOn);
  }, [callState.isSpeakerOn, dispatch]);

  /**
   * Switch between front and back camera.
   */
  const handleSwitchCamera = useCallback(() => {
    switchCam();
  }, []);

  return {
    ...callState,
    startCall,
    acceptCall: handleAcceptCall,
    rejectCall: handleRejectCall,
    cancelCall: handleCancelCall,
    endCall: handleEndCall,
    joinChannel: handleJoinChannel,
    toggleMute: handleToggleMute,
    toggleCamera: handleToggleCamera,
    toggleSpeaker: handleToggleSpeaker,
    switchCamera: handleSwitchCamera,
  };
}

/** Simple string hash to generate numeric UIDs from string user IDs. */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}
