/**
 * Auth state slice — manages user authentication state.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';
import {
  loginUser,
  registerUser,
  logoutUser,
  resetPassword,
} from '@/services/auth';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // true after first auth state check
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

/** Login with email/password */
export const login = createAsyncThunk(
  'auth/login',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const firebaseUser = await loginUser(email, password);
      const user: User = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? 'User',
        email: firebaseUser.email ?? email,
        photoURL: firebaseUser.photoURL,
        fcmToken: null,
        online: true,
        lastSeen: Date.now(),
      };
      return user;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

/** Register with email/password + display name */
export const register = createAsyncThunk(
  'auth/register',
  async (
    {
      email,
      password,
      displayName,
    }: { email: string; password: string; displayName: string },
    { rejectWithValue }
  ) => {
    try {
      const user = await registerUser(email, password, displayName);
      return user;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

/** Logout */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutUser();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Logout failed';
      return rejectWithValue(message);
    }
  }
);

/** Send password reset email */
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await resetPassword(email);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Password reset failed';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called when onAuthStateChanged fires with a user */
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
      state.isInitialized = true;
      state.isLoading = false;
      state.error = null;
    },
    /** Mark auth as initialized (even if no user) */
    setInitialized(state) {
      state.isInitialized = true;
      state.isLoading = false;
    },
    /** Clear any error */
    clearError(state) {
      state.error = null;
    },
    /** Update user profile fields */
    updateUserProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });

    // Forgot password
    builder.addCase(forgotPassword.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(forgotPassword.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(forgotPassword.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setUser, setInitialized, clearError, updateUserProfile } =
  authSlice.actions;
export default authSlice.reducer;
