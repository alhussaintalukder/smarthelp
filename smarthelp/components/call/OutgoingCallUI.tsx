/**
 * Outgoing call UI — shows callee info with ringing animation.
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

import { Avatar } from '@/components/common/Avatar';

interface OutgoingCallUIProps {
  calleeName: string;
  calleePhotoURL?: string | null;
  onCancel: () => void;
}

export function OutgoingCallUI({
  calleeName,
  calleePhotoURL,
  onCancel,
}: OutgoingCallUIProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.callerInfo}>
        <Avatar name={calleeName} photoURL={calleePhotoURL} size={100} />
        <Text style={styles.calleeName}>{calleeName}</Text>
        <Animated.Text style={[styles.callStatus, { opacity: pulseAnim }]}>
          Calling...
        </Animated.Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons
            name="call"
            size={32}
            color="#fff"
            style={styles.cancelIcon}
          />
        </TouchableOpacity>
        <Text style={styles.cancelLabel}>Cancel</Text>
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
    alignItems: 'center',
  },
  callerInfo: {
    alignItems: 'center',
    gap: 16,
  },
  calleeName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
  },
  callStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  actions: {
    alignItems: 'center',
  },
  cancelButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelIcon: {
    transform: [{ rotate: '135deg' }],
  },
  cancelLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 10,
  },
});
