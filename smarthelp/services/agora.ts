/**
 * Agora Video SDK service — engine initialization, join/leave, event handlers.
 *
 * Uses react-native-agora (lower-level SDK) for full control.
 *
 * For development: token is null (App ID-only auth).
 * For production: set AGORA_TOKEN_SERVER_URL in constants/agora.ts
 * and tokens will be fetched via POST request.
 */

import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngineEventHandler,

} from 'react-native-agora';
import { Platform, PermissionsAndroid } from 'react-native';

import { AGORA_APP_ID, AGORA_TOKEN_SERVER_URL } from '@/constants/agora';
import api from './api';

let engine: IRtcEngine | null = null;

/**
 * Get or create the Agora RTC engine singleton.
 */
export function getAgoraEngine(): IRtcEngine {
  if (!engine) {
    engine = createAgoraRtcEngine();
    engine.initialize({
      appId: AGORA_APP_ID,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });
    engine.enableVideo();
    engine.enableAudio();
    engine.startPreview();
  }
  return engine;
}

/**
 * Request camera and microphone permissions on Android.
 */
export async function requestCallPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    const cameraGranted =
      grants[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const audioGranted =
      grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;

    return cameraGranted && audioGranted;
  } catch (err) {
    console.error('Permission request failed:', err);
    return false;
  }
}

/**
 * Fetch an Agora token from the token server (production).
 * Returns null in development (App ID-only auth).
 */
export async function fetchAgoraToken(
  channelName: string,
  uid: number
): Promise<string | null> {
  if (!AGORA_TOKEN_SERVER_URL) {
    // Development mode — no token required
    return null;
  }

  try {
    const response = await api.post(AGORA_TOKEN_SERVER_URL, {
      channelName,
      uid,
    });
    return response.data.token;
  } catch (error) {
    console.error('Failed to fetch Agora token:', error);
    return null;
  }
}

/**
 * Join an Agora video channel.
 */
export async function joinChannel(
  channelId: string,
  uid: number,
  token?: string | null
): Promise<void> {
  const eng = getAgoraEngine();
  const agoraToken = token ?? (await fetchAgoraToken(channelId, uid));

  eng.joinChannel(agoraToken ?? '', channelId, uid, {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    publishMicrophoneTrack: true,
    publishCameraTrack: true,
    autoSubscribeAudio: true,
    autoSubscribeVideo: true,
  });
}

/**
 * Leave the current Agora channel.
 */
export function leaveChannel(): void {
  if (engine) {
    engine.leaveChannel();
  }
}

/**
 * Register event handlers on the Agora engine.
 */
export function registerEventHandler(handler: IRtcEngineEventHandler): void {
  const eng = getAgoraEngine();
  eng.registerEventHandler(handler);
}

/**
 * Unregister event handlers.
 */
export function unregisterEventHandler(handler: IRtcEngineEventHandler): void {
  if (engine) {
    engine.unregisterEventHandler(handler);
  }
}

/**
 * Toggle local audio mute.
 */
export function muteLocalAudio(muted: boolean): void {
  if (engine) {
    engine.muteLocalAudioStream(muted);
  }
}

/**
 * Toggle local video mute.
 */
export function muteLocalVideo(muted: boolean): void {
  if (engine) {
    engine.muteLocalVideoStream(muted);
  }
}

/**
 * Switch between front and back camera.
 */
export function switchCamera(): void {
  if (engine) {
    engine.switchCamera();
  }
}

/**
 * Toggle speakerphone.
 */
export function setSpeakerphone(enabled: boolean): void {
  if (engine) {
    engine.setEnableSpeakerphone(enabled);
  }
}

/**
 * Destroy the Agora engine — call on app unmount.
 */
export function destroyAgoraEngine(): void {
  if (engine) {
    engine.leaveChannel();
    engine.release();
    engine = null;
  }
}
