/**
 * Call control buttons — mute, camera, speaker, switch camera, end call.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
}

export function CallControls({
  isMuted,
  isCameraOff,
  isSpeakerOn,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onSwitchCamera,
  onEndCall,
}: CallControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ControlButton
          icon={isMuted ? 'mic-off' : 'mic'}
          label="Mute"
          active={isMuted}
          onPress={onToggleMute}
        />
        <ControlButton
          icon={isCameraOff ? 'videocam-off' : 'videocam'}
          label="Camera"
          active={isCameraOff}
          onPress={onToggleCamera}
        />
        <ControlButton
          icon={isSpeakerOn ? 'volume-high' : 'volume-mute'}
          label="Speaker"
          active={!isSpeakerOn}
          onPress={onToggleSpeaker}
        />
        <ControlButton
          icon="camera-reverse"
          label="Flip"
          onPress={onSwitchCamera}
        />
      </View>
      <TouchableOpacity
        style={styles.endCallButton}
        onPress={onEndCall}
        activeOpacity={0.7}
      >
        <Ionicons name="call" size={28} color="#fff" style={styles.endIcon} />
      </TouchableOpacity>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.controlButton, active && styles.controlButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={24}
        color={active ? '#fff' : 'rgba(255,255,255,0.9)'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endIcon: {
    transform: [{ rotate: '135deg' }],
  },
});
