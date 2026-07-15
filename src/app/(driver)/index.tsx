import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { StatusBadge, type BadgeTone } from '@/components/status-badge';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import { useTripHail } from '@/lib/ws';
import type { Trip, TripStatus } from '@/types';

const STATUS_LABEL: Record<TripStatus, string> = {
  PLANNED: 'Prévue',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const STATUS_TONE: Record<TripStatus, BadgeTone> = {
  PLANNED: 'neutral',
  IN_PROGRESS: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'destructive',
};

export default function MaTourneeScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);

  const { data: trips, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['trips', 'mine'],
    queryFn: async () => (await api.get<Trip[]>('/trips')).data,
  });

  const startMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/trips/${id}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips', 'mine'] }),
    onError: (err) => Alert.alert('Erreur', extractErrorMessage(err, 'Impossible de démarrer la tournée')),
  });

  const endMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/trips/${id}/end`),
    onSuccess: () => {
      stopTracking();
      queryClient.invalidateQueries({ queryKey: ['trips', 'mine'] });
    },
    onError: (err) => Alert.alert('Erreur', extractErrorMessage(err, 'Impossible de terminer la tournée')),
  });

  async function stopTracking() {
    watchRef.current?.remove();
    watchRef.current = null;
    setTracking(null);
  }

  async function startTracking(tripId: string) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Position requise', 'Autorisez la localisation pour partager votre position en direct.');
      return;
    }
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 20 },
      (loc) => {
        api
          .post(`/trips/${tripId}/location`, {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speedKmh: loc.coords.speed != null ? loc.coords.speed * 3.6 : null,
          })
          .catch(() => {});
      },
    );
    setTracking(tripId);
  }

  useEffect(() => {
    const inProgress = trips?.find((t) => t.status === 'IN_PROGRESS');
    if (inProgress && tracking !== inProgress.id) {
      startTracking(inProgress.id);
    }
    if (!inProgress && tracking) {
      stopTracking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  useEffect(() => () => void stopTracking(), []);

  const inProgressTripId = trips?.find((t) => t.status === 'IN_PROGRESS')?.id ?? null;
  useTripHail(inProgressTripId, (event) => {
    Alert.alert('Un étudiant signale son arrêt', `${event.studentName} souhaite s'arrêter à ${event.stopName}.`);
  });

  const todayTrips = (trips ?? [])
    .filter((t) => t.status !== 'CANCELLED')
    .sort((a, b) => a.scheduledDeparture.localeCompare(b.scheduledDeparture));

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: Spacing.three, gap: Spacing.one }}>
        <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
          Ma tournée
        </ThemedText>
        {tracking && (
          <ThemedText type="small" style={{ color: theme.success }}>
            Position partagée en direct
          </ThemedText>
        )}
      </View>

      <FlatList
        data={todayTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.six }}>
              Aucune tournée assignée
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <View style={{ gap: 4 }}>
              <ThemedText type="smallBold">{item.routeName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {format(new Date(item.scheduledDeparture), 'EEEE d MMMM · HH:mm', { locale: fr })}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Bus {item.busPlateNumber} · {item.passengerCount} passager(s)
              </ThemedText>
              <StatusBadge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
            </View>

            {item.status === 'PLANNED' && (
              <Pressable
                onPress={() => startMutation.mutate(item.id)}
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="small" style={{ color: theme.primaryForeground, fontWeight: '700' }}>
                  Démarrer
                </ThemedText>
              </Pressable>
            )}
            {item.status === 'IN_PROGRESS' && (
              <Pressable
                onPress={() => endMutation.mutate(item.id)}
                style={[styles.actionButton, { backgroundColor: theme.destructive }]}
              >
                <ThemedText type="small" style={{ color: '#fff', fontWeight: '700' }}>
                  Terminer
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
  },
  actionButton: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
});
