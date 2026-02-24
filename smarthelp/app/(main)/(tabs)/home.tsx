/**
 * Home screen — welcome + quick call actions + recent contacts.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,

} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/common/Avatar';
import { useAppSelector } from '@/store';
import { useContacts } from '@/hooks/useContacts';
import { useCall } from '@/hooks/useCall';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import type { User } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUser = useAppSelector((state) => state.auth.user);
  const { contacts } = useContacts();
  const { startCall } = useCall();

  const onlineContacts = contacts.filter((c) => c.online);

  const handleCall = async (contact: User) => {
    const channelId = await startCall(contact);
    if (channelId) {
      router.push({
        pathname: '/(main)/outgoing-call' as any,
        params: {
          channelId,
          calleeName: contact.displayName,
          calleePhoto: contact.photoURL ?? '',
        },
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: colors.text }]}>
          Hello, {currentUser?.displayName ?? 'there'}! 👋
        </Text>
        <Text style={[styles.greetingSub, { color: colors.muted }]}>
          Ready to make a video call?
        </Text>
      </View>

      {/* Quick Action */}
      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(main)/(tabs)/contacts' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="videocam" size={28} color="#fff" />
        <View style={styles.quickActionText}>
          <Text style={styles.quickActionTitle}>Start a Video Call</Text>
          <Text style={styles.quickActionSub}>
            Choose a contact to call
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {/* Online Contacts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Online Now ({onlineContacts.length})
        </Text>
        {onlineContacts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.onlineRow}>
              {onlineContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.uid}
                  style={styles.onlineContact}
                  onPress={() => handleCall(contact)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    name={contact.displayName}
                    photoURL={contact.photoURL}
                    size={56}
                    online
                  />
                  <Text
                    style={[styles.onlineName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {(contact.displayName ?? '').split(' ')[0] || '?'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No contacts online right now
          </Text>
        )}
      </View>

      {/* All Contacts preview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            All Contacts ({contacts.length})
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(main)/(tabs)/contacts' as any)}
          >
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>
        {contacts.slice(0, 5).map((contact) => (
          <TouchableOpacity
            key={contact.uid}
            style={[styles.contactRow, { borderBottomColor: colors.border }]}
            onPress={() => handleCall(contact)}
            activeOpacity={0.7}
          >
            <Avatar
              name={contact.displayName}
              photoURL={contact.photoURL}
              size={44}
              online={contact.online}
            />
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: colors.text }]}>
                {contact.displayName || contact.email?.split('@')[0] || 'Unknown'}
              </Text>
              <Text style={[styles.contactStatus, { color: colors.muted }]}>
                {contact.online ? 'Available' : 'Offline'}
              </Text>
            </View>
            <Ionicons name="videocam-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
  },
  greetingSub: {
    fontSize: 15,
    marginTop: 4,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  quickActionSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  onlineRow: {
    flexDirection: 'row',
    gap: 16,
  },
  onlineContact: {
    alignItems: 'center',
    width: 72,
  },
  onlineName: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactStatus: {
    fontSize: 12,
    marginTop: 2,
  },
});
