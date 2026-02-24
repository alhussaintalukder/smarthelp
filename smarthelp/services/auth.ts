/**
 * Authentication service — Firebase Auth helpers.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, update, get } from 'firebase/database';

import { getFirebaseAuth, getFirebaseDatabase } from './firebase';
import { DB_PATHS } from '@/constants/firebase';
import type { User } from '@/types';

/**
 * Register a new user with email + password, then save profile to RTDB.
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDatabase();

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = credential.user;

  // Update Firebase Auth profile
  await updateProfile(firebaseUser, { displayName });

  // Create user record in RTDB
  const userProfile: User = {
    uid: firebaseUser.uid,
    displayName,
    email: firebaseUser.email ?? email,
    photoURL: null,
    fcmToken: null,
    online: true,
    lastSeen: Date.now(),
  };

  await set(ref(db, `${DB_PATHS.USERS}/${firebaseUser.uid}`), userProfile);
  return userProfile;
}

/**
 * Sign in with email + password.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = credential.user;

  // Sync full profile to RTDB — ensures displayName/uid are always present
  const db = getFirebaseDatabase();
  const userRef = ref(db, `${DB_PATHS.USERS}/${fbUser.uid}`);
  const snapshot = await get(userRef);
  const existing = snapshot.exists() ? (snapshot.val() as Partial<User>) : {};

  await update(userRef, {
    uid: fbUser.uid,
    displayName: existing.displayName || fbUser.displayName || 'User',
    email: fbUser.email ?? email,
    photoURL: existing.photoURL ?? fbUser.photoURL ?? null,
    fcmToken: existing.fcmToken ?? null,
    online: true,
    lastSeen: Date.now(),
  });

  return fbUser;
}

/**
 * Sign out the current user.
 */
export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDatabase();
  const user = auth.currentUser;

  if (user) {
    // Best-effort — don't block sign-out if RTDB write fails
    try {
      await update(ref(db, `${DB_PATHS.USERS}/${user.uid}`), {
        online: false,
        lastSeen: Date.now(),
      });
    } catch {
      // Ignore RTDB errors (e.g. permission_denied) and proceed to sign out
    }
  }

  await firebaseSignOut(auth);
}

/**
 * Send password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current Firebase Auth user.
 */
export function getCurrentUser(): FirebaseUser | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}

/**
 * Convert a FirebaseUser to our User type, reading RTDB for the authoritative profile.
 */
export async function firebaseUserToProfile(firebaseUser: FirebaseUser): Promise<User> {
  try {
    const db = getFirebaseDatabase();
    const snapshot = await get(ref(db, `${DB_PATHS.USERS}/${firebaseUser.uid}`));
    if (snapshot.exists()) {
      const stored = snapshot.val() as Partial<User>;
      return {
        uid: firebaseUser.uid,
        displayName: stored.displayName || firebaseUser.displayName || 'User',
        email: stored.email || firebaseUser.email || '',
        photoURL: stored.photoURL ?? firebaseUser.photoURL ?? null,
        fcmToken: stored.fcmToken ?? null,
        online: stored.online ?? true,
        lastSeen: stored.lastSeen ?? Date.now(),
      };
    }
  } catch {
    // Fall through to Auth-only profile
  }
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? 'User',
    email: firebaseUser.email ?? '',
    photoURL: firebaseUser.photoURL ?? null,
    fcmToken: null,
    online: true,
    lastSeen: Date.now(),
  };
}
