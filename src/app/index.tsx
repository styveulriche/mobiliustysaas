import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!hasHydrated) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'STUDENT') {
    return <Redirect href="/(student)" />;
  }

  if (user.role === 'DRIVER') {
    return <Redirect href="/(driver)" />;
  }

  return <Redirect href="/login" />;
}
