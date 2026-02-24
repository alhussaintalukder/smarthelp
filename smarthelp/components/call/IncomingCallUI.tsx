/**
 * Incoming call UI — full-screen overlay with caller info, accept & reject buttons.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';

import { Avatar } from '@/components/common/Avatar';

interface IncomingCallUIProps {
  callerName: string;
  callerPhotoURL?: string | null;
  onAccept: () => void;
  onReject: () => void;
}

const RINGTONE_URI = 'https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg';

export function IncomingCallUI({
  callerName,
  callerPhotoURL,
  onAccept,
  onReject,
}: IncomingCallUIProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const player = useAudioPlayer(RINGTONE_URI);

  // Pulse animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  // Play ringtone using expo-audio
  useEffect(() => {
    try {
      player.loop = true;
      player.volume = 1.0;
      player.play();
    } catch (err) {
      console.warn('Could not play ringtone:', err);
    }

    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  return (
    <View style={styles.container}>
      <View style={styles.callerInfo}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Avatar name={callerName} photoURL={callerPhotoURL} size={100} />
        </Animated.View>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.callLabel}>Incoming Video Call</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={onReject}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={32} color="#fff" style={styles.rejectIcon} />
          <Text style={styles.actionLabel}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={onAccept}
          activeOpacity={0.7}
        >
          <Ionicons name="videocam" size={32} color="#fff" />
          <Text style={styles.actionLabel}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  callerInfo: {
    alignItems: 'center',
    gap: 16,
  },
  callerName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
  },
  callLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectIcon: {
    transform: [{ rotate: '135deg' }],
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 8,
  },
});
