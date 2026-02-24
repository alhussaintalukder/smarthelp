/**
 * Reusable Avatar component — shows initials if no photo URL.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: number;
  online?: boolean;
}

export function Avatar({ name, photoURL, size = 48, online }: AvatarProps) {
  const safeName = name ?? '';
  const initials = safeName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const fontSize = size * 0.38;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {photoURL ? (
        <Image
          source={{ uri: photoURL }}
          style={[
            styles.image,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
      {online !== undefined && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: online ? '#22c55e' : '#9ca3af',
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
              borderWidth: size * 0.04,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initialsContainer: {
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: '#fff',
  },
});
