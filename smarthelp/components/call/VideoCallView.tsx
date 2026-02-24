/**
 * Video call view — renders local and remote Agora video surfaces.
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';

interface VideoCallViewProps {
  remoteUid: number | null;
  isCameraOff: boolean;
  localUid?: number;
}

export function VideoCallView({
  remoteUid,
  isCameraOff,
  localUid = 0,
}: VideoCallViewProps) {
  return (
    <View style={styles.container}>
      {/* Remote video — full screen */}
      {remoteUid ? (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{ uid: remoteUid }}
        />
      ) : (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Waiting for other user...</Text>
        </View>
      )}

      {/* Local video — PiP in corner */}
      {!isCameraOff ? (
        <View style={styles.localVideoContainer}>
          <RtcSurfaceView
            style={styles.localVideo}
            canvas={{ uid: localUid }}
            zOrderMediaOverlay
          />
        </View>
      ) : (
        <View style={[styles.localVideoContainer, styles.cameraOffContainer]}>
          <Text style={styles.cameraOffText}>Camera Off</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  waitingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideo: {
    flex: 1,
  },
  cameraOffContainer: {
    backgroundColor: '#2d3436',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOffText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});
