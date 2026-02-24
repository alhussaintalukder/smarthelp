/**
 * Call state slice — manages active call state and Agora controls.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CallRecord } from '@/types';

export interface CallState {
  currentCall: CallRecord | null;
  callStatus: 'idle' | 'ringing' | 'outgoing' | 'connected' | 'ended';
  remoteUsers: number[]; // Agora UIDs
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  callDuration: number; // seconds
  isJoined: boolean;
}

const initialState: CallState = {
  currentCall: null,
  callStatus: 'idle',
  remoteUsers: [],
  isMuted: false,
  isCameraOff: false,
  isSpeakerOn: true,
  callDuration: 0,
  isJoined: false,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    /** Start an outgoing call */
    setOutgoingCall(state, action: PayloadAction<CallRecord>) {
      state.currentCall = action.payload;
      state.callStatus = 'outgoing';
      state.remoteUsers = [];
      state.isMuted = false;
      state.isCameraOff = false;
      state.isSpeakerOn = true;
      state.callDuration = 0;
      state.isJoined = false;
    },

    /** Receive an incoming call */
    setIncomingCall(state, action: PayloadAction<CallRecord>) {
      state.currentCall = action.payload;
      state.callStatus = 'ringing';
      state.remoteUsers = [];
      state.isMuted = false;
      state.isCameraOff = false;
      state.isSpeakerOn = true;
      state.callDuration = 0;
      state.isJoined = false;
    },

    /** Call was accepted — both parties connecting */
    setCallConnected(state) {
      state.callStatus = 'connected';
    },

    /** Successfully joined the Agora channel */
    setJoined(state, action: PayloadAction<boolean>) {
      state.isJoined = action.payload;
    },

    /** A remote user joined the Agora channel */
    addRemoteUser(state, action: PayloadAction<number>) {
      if (!state.remoteUsers.includes(action.payload)) {
        state.remoteUsers.push(action.payload);
      }
    },

    /** A remote user left the Agora channel */
    removeRemoteUser(state, action: PayloadAction<number>) {
      state.remoteUsers = state.remoteUsers.filter(
        (uid) => uid !== action.payload
      );
    },

    /** Toggle mute state */
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },

    /** Toggle camera state */
    toggleCamera(state) {
      state.isCameraOff = !state.isCameraOff;
    },

    /** Toggle speaker state */
    toggleSpeaker(state) {
      state.isSpeakerOn = !state.isSpeakerOn;
    },

    /** Update call duration (called every second) */
    incrementDuration(state) {
      state.callDuration += 1;
    },

    /** Update the call record (from RTDB listener) */
    updateCallRecord(state, action: PayloadAction<Partial<CallRecord>>) {
      if (state.currentCall) {
        state.currentCall = { ...state.currentCall, ...action.payload };
      }
    },

    /** End the call — reset to idle */
    resetCallState() {
      return initialState;
    },
  },
});

export const {
  setOutgoingCall,
  setIncomingCall,
  setCallConnected,
  setJoined,
  addRemoteUser,
  removeRemoteUser,
  toggleMute,
  toggleCamera,
  toggleSpeaker,
  incrementDuration,
  updateCallRecord,
  resetCallState,
} = callSlice.actions;

export default callSlice.reducer;
