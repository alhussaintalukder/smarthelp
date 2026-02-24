/**
 * Notification state slice — FCM token and incoming call data.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IncomingCallPayload } from '@/types';

export interface NotificationState {
  expoPushToken: string | null;
  incomingCall: IncomingCallPayload | null;
}

const initialState: NotificationState = {
  expoPushToken: null,
  incomingCall: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setExpoPushToken(state, action: PayloadAction<string | null>) {
      state.expoPushToken = action.payload;
    },
    setIncomingCallNotification(
      state,
      action: PayloadAction<IncomingCallPayload | null>
    ) {
      state.incomingCall = action.payload;
    },
    clearIncomingCallNotification(state) {
      state.incomingCall = null;
    },
  },
});

export const {
  setExpoPushToken,
  setIncomingCallNotification,
  clearIncomingCallNotification,
} = notificationSlice.actions;
export default notificationSlice.reducer;
