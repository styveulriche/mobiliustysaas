import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useTenantBrandStore } from '@/store/tenant-brand-store';
import type { AuthResponse } from '@/types';

export default function LoginScreen() {
  const theme = useTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const tenantCode = useAuthStore((s) => s.tenantCode);
  const branding = useTenantBrandStore((s) => s.branding);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!email || !password) {
      setError('Renseignez votre email et votre mot de passe');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>(
        '/auth/login',
        { email, password },
        { headers: { 'X-Tenant-Code': tenantCode } },
      );
      if (data.user.role !== 'STUDENT' && data.user.role !== 'DRIVER') {
        setError("Cette application est réservée aux étudiants et aux chauffeurs");
        return;
      }
      setSession(data);
      router.replace(data.user.role === 'STUDENT' ? '/(student)' : '/(driver)');
    } catch (err) {
      setError(extractErrorMessage(err, 'Identifiants invalides'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
          {branding?.tagline ?? 'Connectez-vous pour suivre votre transport universitaire'}
        </ThemedText>

        <View style={styles.form}>
          <View style={styles.field}>
            <ThemedText type="smallBold">Email</ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="etudiant@iusty.cm"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Mot de passe</ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
          </View>

          {error && (
            <ThemedText type="small" themeColor="destructive">
              {error}
            </ThemedText>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={theme.primaryForeground} />
            ) : (
              <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>Se connecter</ThemedText>
            )}
          </Pressable>

          <Pressable onPress={() => router.push('/signup' as never)} style={{ alignItems: 'center', marginTop: Spacing.three }}>
            <ThemedText type="small" themeColor="textSecondary">
              Pas encore de compte ? <ThemedText type="smallBold">S'inscrire</ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.two },
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
  subtitle: { textAlign: 'center', marginBottom: Spacing.five },
  form: { gap: Spacing.three },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
