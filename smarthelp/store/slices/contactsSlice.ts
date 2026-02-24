/**
 * Contacts state slice — manages the list of registered users.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ref, get } from 'firebase/database';

import { getFirebaseDatabase } from '@/services/firebase';
import { DB_PATHS } from '@/constants/firebase';
import type { User } from '@/types';

export interface ContactsState {
  contacts: User[];
  isLoading: boolean;
  searchQuery: string;
  error: string | null;
}

const initialState: ContactsState = {
  contacts: [],
  isLoading: false,
  searchQuery: '',
  error: null,
};

/** Fetch all users from RTDB (excluding current user) */
export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (currentUserId: string, { rejectWithValue }) => {
    try {
      const db = getFirebaseDatabase();
      const snapshot = await get(ref(db, DB_PATHS.USERS));

      if (!snapshot.exists()) return [];

      const usersMap = snapshot.val() as Record<string, User>;
      const contacts: User[] = Object.entries(usersMap)
        .map(([key, user]) => ({ ...user, uid: user?.uid ?? key }))
        .filter((user) => user.uid !== currentUserId);

      return contacts;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch contacts';
      return rejectWithValue(message);
    }
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setContacts(state, action: PayloadAction<User[]>) {
      state.contacts = action.payload;
      state.isLoading = false;
    },
    clearContacts(state) {
      state.contacts = [];
      state.searchQuery = '';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchContacts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.contacts = action.payload;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(fetchContacts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setSearchQuery, setContacts, clearContacts } =
  contactsSlice.actions;
export default contactsSlice.reducer;
