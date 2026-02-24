/**
 * Redux store configuration.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import callReducer from './slices/callSlice';
import contactsReducer from './slices/contactsSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    call: callReducer,
    contacts: contactsReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore paths that contain non-serializable values
        ignoredActions: ['auth/setUser'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Typed hooks — use these instead of plain useSelector/useDispatch.
 */
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
