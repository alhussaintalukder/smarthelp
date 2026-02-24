/**
 * Contact list with search filtering.
 */

import React from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';

import { ContactCard } from './ContactCard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import type { User } from '@/types';

interface ContactListProps {
  contacts: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCall: (contact: User) => void;
  isLoading?: boolean;
}

export function ContactList({
  contacts,
  searchQuery,
  onSearchChange,
  onCall,
  isLoading,
}: ContactListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.muted }]}>
        {searchQuery
          ? 'No contacts match your search'
          : 'No contacts found. Ask others to register!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search contacts..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <ContactCard contact={item} onCall={onCall} />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredContacts.length === 0 && styles.emptyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    height: 44,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
});
