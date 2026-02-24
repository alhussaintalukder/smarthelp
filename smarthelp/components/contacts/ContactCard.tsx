/**
 * Single contact card — shows avatar, name, online status, and video call button.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/common/Avatar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import type { User } from '@/types';

interface ContactCardProps {
  contact: User;
  onCall: (contact: User) => void;
}

export function ContactCard({ contact, onCall }: ContactCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Avatar
        name={contact.displayName}
        photoURL={contact.photoURL}
        size={50}
        online={contact.online}
      />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>
          {contact.displayName}
        </Text>
        <Text style={[styles.status, { color: colors.muted }]}>
          {contact.online ? 'Online' : 'Offline'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.callButton, { backgroundColor: colors.success }]}
        onPress={() => onCall(contact)}
        activeOpacity={0.7}
      >
        <Ionicons name="videocam" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
    marginTop: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
