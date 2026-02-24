/**
 * Agora configuration — values loaded from .env via EXPO_PUBLIC_ prefix.
 *
 * For development, EXPO_PUBLIC_AGORA_TOKEN_SERVER_URL can be left blank
 * to use App-ID-only authentication (no token required).
 * For production, set it to your token server endpoint:
 *   POST {TOKEN_SERVER_URL}  →  { token: string }
 */

export const AGORA_APP_ID: string =
  process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';

export const AGORA_APP_CERTIFICATE: string =
  process.env.EXPO_PUBLIC_AGORA_APP_CERTIFICATE ?? '';

export const AGORA_TOKEN_SERVER_URL: string | null =
  process.env.EXPO_PUBLIC_AGORA_TOKEN_SERVER_URL || null;
