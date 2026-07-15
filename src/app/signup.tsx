import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function SignupScreen() {
  const theme = useTheme();
  const tenantCode = useAuthStore((s) => s.tenantCode);

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    matricule: '',
    filiere: '',
    niveau: '',
    anneeAcademique: '',
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const registerMutation = useMutation({
    mutationFn: async () =>
      api.post(
        '/auth/register',
        { ...form },
        { headers: { 'X-Tenant-Code': tenantCode } },
      ),
    onSuccess: () => {
      router.push({ pathname: '/verify-otp' as never, params: { email: form.email } });
    },
    onError: (err) => setError(extractErrorMessage(err, "Impossible de créer le compte")),
  });

  function onSubmit() {
    if (!form.email || !form.password || !form.firstName || !form.lastName || !form.matricule) {
      setError('Renseignez au moins email, mot de passe, nom, prénom et matricule');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setError(null);
    registerMutation.mutate();
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText type="title" style={styles.title}>
            Créer un compte étudiant
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Renseignez vos informations pour vous inscrire
          </ThemedText>

          <View style={styles.form}>
            <Field label="Email">
              <TextInput
                value={form.email}
                onChangeText={(v) => set('email', v)}
                placeholder="etudiant@iusty.cm"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </Field>

            <Field label="Mot de passe">
              <TextInput
                value={form.password}
                onChangeText={(v) => set('password', v)}
                placeholder="8 caractères minimum"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </Field>

            <View style={styles.row}>
              <Field label="Prénom" style={styles.half}>
                <TextInput
                  value={form.firstName}
                  onChangeText={(v) => set('firstName', v)}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
              </Field>
              <Field label="Nom" style={styles.half}>
                <TextInput
                  value={form.lastName}
                  onChangeText={(v) => set('lastName', v)}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
              </Field>
            </View>

            <Field label="Téléphone">
              <TextInput
                value={form.phone}
                onChangeText={(v) => set('phone', v)}
                placeholder="+237 6XX XXX XXX"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </Field>

            <Field label="Matricule">
              <TextInput
                value={form.matricule}
                onChangeText={(v) => set('matricule', v)}
                autoCapitalize="characters"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </Field>

            <View style={styles.row}>
              <Field label="Filière" style={styles.half}>
                <TextInput
                  value={form.filiere}
                  onChangeText={(v) => set('filiere', v)}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
              </Field>
              <Field label="Niveau" style={styles.half}>
                <TextInput
                  value={form.niveau}
                  onChangeText={(v) => set('niveau', v)}
                  placeholder="L1, L2, M1…"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
              </Field>
            </View>

            <Field label="Année académique">
              <TextInput
                value={form.anneeAcademique}
                onChangeText={(v) => set('anneeAcademique', v)}
                placeholder="2025-2026"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />
            </Field>

            {error && (
              <ThemedText type="small" themeColor="destructive">
                {error}
              </ThemedText>
            )}

            <Pressable
              onPress={onSubmit}
              disabled={registerMutation.isPending}
              style={[styles.button, { backgroundColor: theme.primary, opacity: registerMutation.isPending ? 0.7 : 1 }]}
            >
              <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>
                {registerMutation.isPending ? 'Création…' : 'Créer mon compte'}
              </ThemedText>
            </Pressable>

            <Pressable onPress={() => router.back()} style={{ alignItems: 'center', marginTop: Spacing.two }}>
              <ThemedText type="small" themeColor="textSecondary">
                Déjà un compte ? Se connecter
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: Spacing.one }, style]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.four, gap: Spacing.two },
  title: { fontSize: 24, lineHeight: 30 },
  subtitle: { marginBottom: Spacing.three },
  form: { gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.two },
  half: { flex: 1 },
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
