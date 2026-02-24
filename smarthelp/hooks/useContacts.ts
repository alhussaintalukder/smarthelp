/**
 * Contacts hook — provides contact list, search, and call initiation.
 */

import { useCallback, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  setSearchQuery,
  setContacts,
} from '@/store/slices/contactsSlice';
import { getFirebaseDatabase } from '@/services/firebase';
import { DB_PATHS } from '@/constants/firebase';
import type { User } from '@/types';

/**
 * Subscribes to real-time contact updates and provides search.
 */
export function useContacts() {
  const dispatch = useAppDispatch();
  const { contacts, isLoading, searchQuery, error } = useAppSelector(
    (state) => state.contacts
  );
  const currentUser = useAppSelector((state) => state.auth.user);

  // Subscribe to real-time user list updates
  useEffect(() => {
    if (!currentUser) return;

    const db = getFirebaseDatabase();
    const usersRef = ref(db, DB_PATHS.USERS);

    onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        dispatch(setContacts([]));
        return;
      }

      const usersMap = snapshot.val() as Record<string, User>;
      const contactList = Object.entries(usersMap)
        .map(([key, user]) => ({
          ...user,
          uid: user?.uid ?? key,
          displayName:
            user?.displayName ||
            (user?.email ? user.email.split('@')[0] : null) ||
            key.slice(0, 8),
        }))
        .filter((user) => user.uid !== currentUser.uid);
      dispatch(setContacts(contactList));
    });

    return () => off(usersRef);
  }, [currentUser, dispatch]);

  const updateSearch = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  return {
    contacts,
    isLoading,
    searchQuery,
    error,
    updateSearch,
  };
}
