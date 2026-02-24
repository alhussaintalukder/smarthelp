/**
 * App entry point — renders LoadingScreen while the AuthGate
 * in _layout.tsx determines whether to send the user to
 * /(auth)/login or /(main)/(tabs)/home.
 */

import { LoadingScreen } from '@/components/common/LoadingScreen';

export default function Index() {
  return <LoadingScreen message="Starting SmartHelp..." />;
}
