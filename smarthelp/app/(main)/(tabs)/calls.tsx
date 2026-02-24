/**
 * Call history screen — shows past calls with status color coding.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,

} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { ref, onValue, off } from 'firebase/database';

import { Avatar } from '@/components/common/Avatar';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAppSelector } from '@/store';
import { getFirebaseDatabase } from '@/services/firebase';
import { DB_PATHS } from '@/constants/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import type { CallHistoryEntry } from '@/types';

export default function CallsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentUser = useAppSelector((state) => state.auth.user);
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const db = getFirebaseDatabase();
    const historyRef = ref(
      db,
      `${DB_PATHS.CALL_HISTORY}/${currentUser.uid}`
    );

    onValue(historyRef, (snapshot) => {
      if (!snapshot.exists()) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      const data = snapshot.val() as Record<string, CallHistoryEntry>;
      const entries = Object.values(data).sort(
        (a, b) => b.timestamp - a.timestamp
      );
      setHistory(entries);
      setIsLoading(false);
    });

    return () => off(historyRef);
  }, [currentUser]);

  if (isLoading) {
    return <LoadingScreen message="Loading call history..." />;
  }

  const getStatusColor = (entry: CallHistoryEntry) => {
    if (entry.status === 'missed' || entry.status === 'rejected') {
      return colors.danger;
    }
    if (entry.status === 'ended' && entry.duration > 0) {
      return colors.success;
    }
    return colors.muted;
  };

  const getStatusIcon = (
    entry: CallHistoryEntry
  ): React.ComponentProps<typeof Ionicons>['name'] => {
    if (entry.direction === 'outgoing') {
      return entry.status === 'missed' || entry.status === 'cancelled'
        ? 'call-outline'
        : 'arrow-up';
    }
    return entry.status === 'missed' || entry.status === 'rejected'
      ? 'call-outline'
      : 'arrow-down';
  };

  const getStatusLabel = (entry: CallHistoryEntry) => {
    if (entry.status === 'missed') return 'Missed';
    if (entry.status === 'rejected') return 'Rejected';
    if (entry.status === 'cancelled') return 'Cancelled';
    if (entry.duration > 0) {
      const mins = Math.floor(entry.duration / 60);
      const secs = entry.duration % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return entry.status;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: CallHistoryEntry }) => (
    <View style={[styles.item, { borderBottomColor: colors.border }]}>
      <Avatar name={item.otherUserName} size={46} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>
          {item.otherUserName}
        </Text>
        <View style={styles.statusRow}>
          <Ionicons
            name={getStatusIcon(item)}
            size={14}
            color={getStatusColor(item)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item) }]}>
            {item.direction === 'outgoing' ? 'Outgoing' : 'Incoming'} •{' '}
            {getStatusLabel(item)}
          </Text>
        </View>
      </View>
      <Text style={[styles.time, { color: colors.muted }]}>
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="call-outline" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            No call history yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.muted }]}>
            Your call history will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.channelId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingTop: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  statusText: {
    fontSize: 13,
  },
  time: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
});
