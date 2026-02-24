# SmartHelp — Video Calling App

A real-time video calling Android app built with **Expo 54 / React Native**, **Firebase** (Auth + Realtime Database), and **Agora** for media transport.

---

## Features

- Email / password sign-up & sign-in
- Real-time contacts list with online presence
- One-tap video calling via Agora RTC
- Incoming call screen with ringtone & accept / reject
- Call history
- Profile editing (display name, online toggle)
- Push notifications (Expo)
- Dark / light theme

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81 |
| Navigation | expo-router v6 (file-based) |
| State | Redux Toolkit |
| Auth | Firebase Authentication |
| Realtime DB | Firebase Realtime Database |
| Video | Agora Video SDK (`react-native-agora`) |
| Notifications | Expo Notifications |
| Audio | expo-audio |
| Language | TypeScript (strict) |

---

## Prerequisites

- Node.js 18+
- Android Studio + Android SDK (for device/emulator builds)
- [Expo CLI](https://docs.expo.dev/more/expo-cli/)
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`)
- A Firebase project with **Authentication** (Email/Password) and **Realtime Database** enabled
- An [Agora](https://console.agora.io) project

---

## Setup

### 1. Install dependencies

```bash
cd smarthelp
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your real credentials:

```dotenv
# Firebase — Project Settings → Your apps → Web app
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_DATABASE_URL=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Agora — console.agora.io → Project Management
EXPO_PUBLIC_AGORA_APP_ID=
EXPO_PUBLIC_AGORA_APP_CERTIFICATE=
EXPO_PUBLIC_AGORA_TOKEN_SERVER_URL=   # leave blank for dev (App-ID-only mode)
```

### 3. Firebase Realtime Database Rules

In Firebase Console → Realtime Database → Rules, publish:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "calls": {
      "$channelId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

---

## Running locally

```bash
# Start Metro bundler
npx expo start

# Build & install directly on a connected Android device
npx expo run:android
```

---

## Building with EAS

```bash
# Development build (internal distribution)
eas build --profile development --platform android

# Preview APK
eas build --profile preview --platform android

# Production AAB (Play Store)
eas build --profile production --platform android
```

EAS environment variables are configured in `eas.json` and mirrored in the EAS dashboard under **Project → Secrets**.

---

## Project Structure

```
app/
├── _layout.tsx          # Root layout: Redux + Firebase init + AuthGate
├── index.tsx            # Entry point (redirected by AuthGate)
├── (auth)/              # Login, Register, Forgot Password
└── (main)/
    ├── (tabs)/          # Home, Contacts, Calls, Profile
    ├── incoming-call.tsx
    ├── outgoing-call.tsx
    └── call/[channelId].tsx   # Active video call

services/        # Firebase auth, RTDB helpers, Agora, call logic, notifications
store/           # Redux store + slices (auth, call, contacts, notification)
hooks/           # useAuth, useCall, useContacts
components/      # Avatar, Button, ContactCard, CallControls, VideoCallView …
constants/       # Theme colours, Firebase / Agora config from env
types/           # Shared TypeScript interfaces
```

---

## License

MIT
