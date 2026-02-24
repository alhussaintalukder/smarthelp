/**
 * Firebase configuration — values loaded from .env via EXPO_PUBLIC_ prefix.
 *
 * Expo's bundler statically replaces process.env.EXPO_PUBLIC_* at build time,
 * so these are safe to use client-side without a server.
 *
 * Copy .env.example → .env and fill in the real values from:
 * Firebase Console → Project Settings → Your apps → Web app
 */

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Firebase Realtime Database paths
 */
export const DB_PATHS = {
  USERS: 'users',
  CALLS: 'calls',
  CALL_HISTORY: 'callHistory',
  CONNECTED: '.info/connected',
} as const;
