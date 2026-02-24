/**
 * Contacts screen — list all registered users with search and call.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ContactList } from '@/components/contacts/ContactList';
import { useContacts } from '@/hooks/useContacts';
import { useCall } from '@/hooks/useCall';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import type { User } from '@/types';

export default function ContactsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { contacts, isLoading, searchQuery, updateSearch } = useContacts();
  const { startCall } = useCall();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ContactList
        contacts={contacts}
        searchQuery={searchQuery}
        onSearchChange={updateSearch}
        onCall={handleCall}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
