/**
 * Profile screen — user info, edit name, online toggle, sign out.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ref, update } from 'firebase/database';

import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector, useAppDispatch } from '@/store';
import { updateUserProfile } from '@/store/slices/authSlice';
import { getFirebaseDatabase } from '@/services/firebase';
import { DB_PATHS } from '@/constants/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const dispatch = useAppDispatch();
  const { logout, isLoading } = useAuth();
  const user = useAppSelector((state) => state.auth.user);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName ?? '');

  const handleSaveName = useCallback(async () => {
    if (!user || !newName.trim()) return;

    try {
      const db = getFirebaseDatabase();
      await update(ref(db, `${DB_PATHS.USERS}/${user.uid}`), {
        displayName: newName.trim(),
      });
      dispatch(updateUserProfile({ displayName: newName.trim() }));
      setEditingName(false);
    } catch {
      Alert.alert('Error', 'Failed to update display name.');
    }
  }, [user, newName, dispatch]);

  const handleToggleOnline = useCallback(
    async (value: boolean) => {
      if (!user) return;

      try {
        const db = getFirebaseDatabase();
        await update(ref(db, `${DB_PATHS.USERS}/${user.uid}`), {
          online: value,
          lastSeen: Date.now(),
        });
        dispatch(updateUserProfile({ online: value }));
      } catch {
        Alert.alert('Error', 'Failed to update status.');
      }
    },
    [user, dispatch]
  );

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar & Name */}
      <View style={styles.avatarSection}>
        <Avatar
          name={user.displayName}
          photoURL={user.photoURL}
          size={90}
          online={user.online}
        />
        {editingName ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={[
                styles.nameInput,
                { color: colors.text, borderColor: colors.primary },
              ]}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity onPress={handleSaveName}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingName(false)}>
              <Ionicons name="close-circle" size={28} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nameRow}
            onPress={() => {
              setNewName(user.displayName);
              setEditingName(true);
            }}
          >
            <Text style={[styles.displayName, { color: colors.text }]}>
              {user.displayName}
            </Text>
            <Ionicons name="pencil" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
        <Text style={[styles.email, { color: colors.muted }]}>
          {user.email}
        </Text>
      </View>

      {/* Settings */}
      <View
        style={[styles.settingSection, { backgroundColor: colors.card }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          Status
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Ionicons
              name={user.online ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={user.online ? colors.success : colors.muted}
            />
            <Text style={[styles.settingText, { color: colors.text }]}>
              Available for Calls
            </Text>
          </View>
          <Switch
            value={user.online}
            onValueChange={handleToggleOnline}
            trackColor={{ false: colors.muted, true: colors.success }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View
        style={[styles.settingSection, { backgroundColor: colors.card }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          Account Info
        </Text>
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Ionicons name="mail-outline" size={20} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {user.email}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="finger-print-outline" size={20} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            {user.uid.slice(0, 12)}...
          </Text>
        </View>
      </View>

      {/* Sign Out */}
      <View style={styles.logoutSection}>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          loading={isLoading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 120,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  settingSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoText: {
    fontSize: 15,
  },
  logoutSection: {
    marginHorizontal: 16,
    marginTop: 32,
  },
});
