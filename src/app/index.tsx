import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth-store';
import { useTenantBrandStore } from '@/store/tenant-brand-store';
import { Spacing } from '@/constants/theme';

export default function Index() {
  const theme = useTheme();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const branding = useTenantBrandStore((s) => s.branding);

  if (!hasHydrated) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'STUDENT') {
      return <Redirect href="/(student)" />;
    }
    if (user.role === 'DRIVER') {
      return <Redirect href="/(driver)" />;
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {branding?.logoUrl ? (
          <Image source={{ uri: branding.logoUrl }} style={styles.logoImage} />
        ) : (
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <ThemedText style={{ color: theme.primaryForeground, fontSize: 28, fontWeight: '800' }}>
              {(branding?.name ?? 'IUSTY BUS').slice(0, 2).toUpperCase()}
            </ThemedText>
          </View>
        )}
        <ThemedText type="title" style={styles.title}>
          {branding?.name ?? 'IUSTY BUS'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {branding?.tagline ?? 'Le transport universitaire, suivi en temps réel'}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/login')}
            style={[styles.button, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>Se connecter</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => router.push('/signup' as never)}
            style={[styles.button, styles.secondaryButton, { borderColor: theme.primary }]}
          >
            <ThemedText style={{ color: theme.primary, fontWeight: '700' }}>Créer mon compte</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four },
  logo: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  logoImage: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    marginBottom: Spacing.three,
  },
  title: { textAlign: 'center', fontSize: 28, lineHeight: 34 },
  subtitle: { textAlign: 'center', marginTop: Spacing.one, marginBottom: Spacing.six },
  actions: { gap: Spacing.two },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
});
