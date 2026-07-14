import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import type { IncidentSeverity, IncidentType, Trip } from '@/types';

const TYPES: { value: IncidentType; label: string }[] = [
  { value: 'PANNE', label: 'Panne' },
  { value: 'ACCIDENT', label: 'Accident' },
  { value: 'EMBOUTEILLAGE', label: 'Embouteillage' },
  { value: 'AUTRE', label: 'Autre' },
];

const SEVERITIES: { value: IncidentSeverity; label: string }[] = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Élevée' },
  { value: 'CRITICAL', label: 'Critique' },
];

export default function IncidentScreen() {
  const theme = useTheme();
  const [type, setType] = useState<IncidentType>('PANNE');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: trips } = useQuery({
    queryKey: ['trips', 'mine'],
    queryFn: async () => (await api.get<Trip[]>('/trips')).data,
  });
  const activeTrip = trips?.find((t) => t.status === 'IN_PROGRESS');

  const mutation = useMutation({
    mutationFn: async () =>
      api.post('/incidents', {
        tripId: activeTrip?.id ?? null,
        type,
        description,
        severity,
      }),
    onSuccess: () => {
      setSuccess(true);
      setDescription('');
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => setError(extractErrorMessage(err, "Impossible d'envoyer le signalement")),
  });

  function onSubmit() {
    if (!description.trim()) {
      setError('Décrivez brièvement ce qui se passe');
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
        Signaler un incident
      </ThemedText>
      {activeTrip && (
        <ThemedText type="small" themeColor="textSecondary">
          Tournée en cours : {activeTrip.routeName}
        </ThemedText>
      )}

      <ScrollView contentContainerStyle={{ gap: Spacing.three, paddingBottom: Spacing.four }}>
        <View style={{ gap: Spacing.one }}>
          <ThemedText type="smallBold">Type d'incident</ThemedText>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={[
                  styles.chip,
                  { borderColor: theme.border },
                  type === t.value && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                <ThemedText type="small" style={type === t.value ? { color: theme.primaryForeground } : undefined}>
                  {t.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: Spacing.one }}>
          <ThemedText type="smallBold">Gravité</ThemedText>
          <View style={styles.chipRow}>
            {SEVERITIES.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => setSeverity(s.value)}
                style={[
                  styles.chip,
                  { borderColor: theme.border },
                  severity === s.value && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              >
                <ThemedText type="small" style={severity === s.value ? { color: theme.primaryForeground } : undefined}>
                  {s.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: Spacing.one }}>
          <ThemedText type="smallBold">Description</ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez ce qui se passe…"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            style={[styles.textarea, { borderColor: theme.border, color: theme.text }]}
          />
        </View>

        {error && (
          <ThemedText type="small" themeColor="destructive">
            {error}
          </ThemedText>
        )}
        {success && (
          <ThemedText type="small" style={{ color: theme.success }}>
            Incident signalé avec succès
          </ThemedText>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={mutation.isPending}
          style={[styles.submit, { backgroundColor: theme.destructive, opacity: mutation.isPending ? 0.6 : 1 }]}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Envoyer le signalement</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submit: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
