/**
 * Active video call screen — Agora RTC + call controls.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Alert,
  Text,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { VideoCallView } from '@/components/call/VideoCallView';
import { CallControls } from '@/components/call/CallControls';
import { store, useAppDispatch, useAppSelector } from '@/store';
import {
  setJoined,
  addRemoteUser,
  removeRemoteUser,
  toggleMute,
  toggleCamera,
  toggleSpeaker,
  incrementDuration,
  resetCallState,
} from '@/store/slices/callSlice';
import { clearIncomingCallNotification } from '@/store/slices/notificationSlice';
import {
  joinChannel as agoraJoin,
  leaveChannel as agoraLeave,
  registerEventHandler,
  muteLocalAudio,
  muteLocalVideo,
  switchCamera,
  setSpeakerphone,
  requestCallPermissions,
} from '@/services/agora';
import { endCall as endCallService } from '@/services/callService';

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return hash;
}

export default function ActiveCallScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const {
    isMuted,
    isCameraOff,
    isSpeakerOn,
    callDuration,
    remoteUsers,
    isJoined,
  } = useAppSelector((s) => s.call);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Format seconds → mm:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = useCallback(async () => {
    try {
      await agoraLeave();
    } catch {}

    if (channelId) {
      try {
        await endCallService(channelId, callDuration);
      } catch {}
    }

    dispatch(clearIncomingCallNotification());
    dispatch(resetCallState());

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/(tabs)/home' as any);
    }
  }, [channelId, callDuration, dispatch, router]);

  // Join Agora channel on mount
  useEffect(() => {
    if (!channelId || !user) return;

    let mounted = true;

    (async () => {
      try {
        const granted = await requestCallPermissions();
        if (!granted) {
          setJoinError('Camera/microphone permissions are required.');
          return;
        }

        const uid = Math.abs(hashCode(user.uid)) % 100000;

        // Register event handlers BEFORE joining
        registerEventHandler({
          onJoinChannelSuccess: (_connection, _elapsed) => {
            if (mounted) dispatch(setJoined(true));
          },
          onUserJoined: (_connection, remoteUid) => {
            if (mounted) dispatch(addRemoteUser(remoteUid));
          },
          onUserOffline: (_connection, remoteUid) => {
            if (mounted) dispatch(removeRemoteUser(remoteUid));
          },
          onError: (_err, msg) => {
            console.warn('[Agora] error:', _err, msg);
          },
        });

        await agoraJoin(channelId, uid, null);
      } catch (err: any) {
        console.error('[ActiveCall] join error:', err);
        if (mounted) setJoinError(err?.message ?? 'Failed to join channel.');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [channelId, user, dispatch]);

  // Duration timer
  useEffect(() => {
    if (isJoined) {
      timerRef.current = setInterval(() => {
        dispatch(incrementDuration());
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isJoined, dispatch]);

  // Back button confirmation
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('End Call', 'Do you want to end this call?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: handleEndCall },
      ]);
      return true;
    });
    return () => handler.remove();
  }, [channelId, handleEndCall]);

  // Auto-end when remote user leaves and there are no more remote users
  useEffect(() => {
    if (isJoined && remoteUsers.length === 0) {
      const timeout = setTimeout(() => {
        const state = store.getState();
        if (state.call.isJoined && state.call.remoteUsers.length === 0 && state.call.callDuration > 2) {
          handleEndCall();
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isJoined, remoteUsers.length, handleEndCall]);

  const handleToggleMute = useCallback(() => {
    muteLocalAudio(!isMuted);
    dispatch(toggleMute());
  }, [isMuted, dispatch]);

  const handleToggleCamera = useCallback(() => {
    muteLocalVideo(!isCameraOff);
    dispatch(toggleCamera());
  }, [isCameraOff, dispatch]);

  const handleToggleSpeaker = useCallback(() => {
    setSpeakerphone(!isSpeakerOn);
    dispatch(toggleSpeaker());
  }, [isSpeakerOn, dispatch]);

  const handleSwitchCamera = useCallback(() => {
    switchCamera();
  }, []);

  const firstRemoteUid = remoteUsers.length > 0 ? remoteUsers[0] : null;

  if (joinError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{joinError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoCallView
        remoteUid={firstRemoteUid}
        isCameraOff={isCameraOff}
      />

      {/* Duration */}
      <View style={styles.durationContainer}>
        <Text style={styles.durationText}>
          {formatDuration(callDuration)}
        </Text>
      </View>

      <CallControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isSpeakerOn={isSpeakerOn}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleSpeaker={handleToggleSpeaker}
        onSwitchCamera={handleSwitchCamera}
        onEndCall={handleEndCall}
      />
    </View>
  );
}

// Need direct store access for the timeout re-check - imported above with useAppDispatch/useAppSelector

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  durationContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 48 : 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  durationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
