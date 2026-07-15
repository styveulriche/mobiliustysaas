import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { AuthResponse } from '@/types';

export default function VerifyOtpScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email: string }>();
  const tenantCode = useAuthStore((s) => s.tenantCode);
  const setSession = useAuthStore((s) => s.setSession);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<AuthResponse>(
          '/auth/otp/verify',
          { email: params.email, code },
          { headers: { 'X-Tenant-Code': tenantCode } },
        )
      ).data,
    onSuccess: (data) => {
      setSession(data);
      router.replace(data.user.role === 'STUDENT' ? '/(student)' : '/(driver)');
    },
    onError: (err) => setError(extractErrorMessage(err, 'Code invalide ou expiré')),
  });

  const resendMutation = useMutation({
    mutationFn: async () =>
      api.post(
        '/auth/otp/resend',
        { email: params.email },
        { headers: { 'X-Tenant-Code': tenantCode } },
      ),
    onSuccess: () => setError(null),
  });

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={{ fontSize: 24, lineHeight: 30 }}>
          Vérifiez votre e-mail
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one, marginBottom: Spacing.four }}>
          Un code à 6 chiffres a été envoyé à {params.email}
        </ThemedText>

        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        {error && (
          <ThemedText type="small" themeColor="destructive" style={{ marginTop: Spacing.two }}>
            {error}
          </ThemedText>
        )}

        <Pressable
          onPress={() => verifyMutation.mutate()}
          disabled={verifyMutation.isPending || code.length < 6}
          style={[styles.button, { backgroundColor: theme.primary, opacity: verifyMutation.isPending ? 0.7 : 1 }]}
        >
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>
            {verifyMutation.isPending ? 'Vérification…' : 'Valider'}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => resendMutation.mutate()}
          disabled={resendMutation.isPending}
          style={{ alignItems: 'center', marginTop: Spacing.three }}
        >
          <ThemedText type="small" themeColor="textSecondary">
            {resendMutation.isSuccess ? 'Nouveau code envoyé' : 'Renvoyer le code'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: Spacing.four },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
});
