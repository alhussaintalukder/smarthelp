import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { store, useAppDispatch, useAppSelector } from '@/store';
import { setUser, setInitialized } from '@/store/slices/authSlice';
import {
  setIncomingCallNotification,
  setExpoPushToken,
} from '@/store/slices/notificationSlice';
import { setIncomingCall } from '@/store/slices/callSlice';
import { initFirebase, getFirebaseDatabase } from '@/services/firebase';
import { subscribeToAuthState, firebaseUserToProfile } from '@/services/auth';
import { subscribeToIncomingCalls } from '@/services/callService';
import {
  configureNotifications,
  registerForPushNotifications,
  saveFcmToken,
} from '@/services/notificationService';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ref, update, onDisconnect } from 'firebase/database';
import { DB_PATHS } from '@/constants/firebase';

// Keep splash visible until we decide where to send the user
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Handles auth-based routing and data subscriptions */
function AuthGate() {
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized, user } = useAppSelector((s) => s.auth);
  const incomingCall = useAppSelector((s) => s.notification.incomingCall);

  // Firebase auth listener
  useEffect(() => {
    initFirebase();
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        const profile = await firebaseUserToProfile(fbUser);
        dispatch(setUser(profile));

        // Repair + update profile in RTDB on every app open
        try {
          const db = getFirebaseDatabase();
          const userRef = ref(db, `${DB_PATHS.USERS}/${fbUser.uid}`);
          await update(userRef, {
            uid: fbUser.uid,
            displayName: profile.displayName || fbUser.displayName || 'User',
            email: profile.email || fbUser.email || '',
            photoURL: profile.photoURL ?? fbUser.photoURL ?? null,
            online: true,
            lastSeen: Date.now(),
          });
          onDisconnect(userRef).update({ online: false, lastSeen: Date.now() });
        } catch {}

        // Push notifications
        try {
          const token = await registerForPushNotifications();
          if (token) {
            dispatch(setExpoPushToken(token));
            await saveFcmToken(fbUser.uid, token);
          }
        } catch {}
      } else {
        dispatch(setUser(null));
      }
      dispatch(setInitialized());
    });
    configureNotifications();
    return unsubscribe;
  }, [dispatch]);

  // Subscribe to incoming calls when authenticated
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToIncomingCalls(user.uid, (call) => {
      if (call && call.status === 'ringing') {
        dispatch(setIncomingCallNotification(call));
        dispatch(
          setIncomingCall({
            channelId: call.channelId,
            callerId: call.callerId,
            callerName: call.callerName,
            callerPhoto: call.callerPhoto ?? null,
            calleeId: call.calleeId,
            calleeName: call.calleeName ?? '',
            calleePhoto: call.calleePhoto ?? null,
            status: 'ringing',
            type: (call as any).type ?? 'video',
            createdAt: call.createdAt,
          })
        );
      }
    });
    return unsubscribe;
  }, [user, dispatch]);

  // Redirect once auth state is resolved, then hide splash
  useEffect(() => {
    if (!isInitialized) return;

    const inAuth = segments[0] === '(auth)';
    const inMain = segments[0] === '(main)';
    const onIndex = !(inAuth || inMain);

    if (!isAuthenticated && (onIndex || inMain)) {
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && (onIndex || inAuth)) {
      router.replace('/(main)/(tabs)/home' as any);
    }

    // Hide splash after routing decision
    SplashScreen.hideAsync().catch(() => {});
  }, [isAuthenticated, isInitialized, segments, router]);

  // Navigate to incoming-call screen when a new call arrives
  useEffect(() => {
    if (incomingCall && isAuthenticated) {
      router.push('/(main)/incoming-call' as any);
    }
  }, [incomingCall, isAuthenticated, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
        </Stack>
        <AuthGate />
        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}
