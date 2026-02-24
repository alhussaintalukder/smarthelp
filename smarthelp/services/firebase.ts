/**
 * Firebase initialization & singleton instances.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { FIREBASE_CONFIG } from '@/constants/firebase';

// getReactNativePersistence is exported at runtime but missing from TS declarations
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require('firebase/auth') as { getReactNativePersistence: any };

let app: FirebaseApp;
let auth: Auth;
let database: Database;

/**
 * Initialize Firebase — call once at app start.
 * Uses AsyncStorage for auth persistence on React Native.
 */
export function initFirebase(): void {
  if (getApps().length === 0) {
    app = initializeApp(FIREBASE_CONFIG);

    // Initialize Auth with AsyncStorage persistence for React Native
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

    database = getDatabase(app);
  } else {
    app = getApp();
    auth = getAuth(app);
    database = getDatabase(app);
  }
}

export function getFirebaseAuth(): Auth {
  if (!auth) initFirebase();
  return auth;
}

export function getFirebaseDatabase(): Database {
  if (!database) initFirebase();
  return database;
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) initFirebase();
  return app;
}
