import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import type { RouteDto, Trip } from '@/types';

export default function ReserverScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [boardingStopId, setBoardingStopId] = useState<string | null>(null);
  const [alightingStopId, setAlightingStopId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => (await api.get<Trip>(`/trips/${tripId}`)).data,
    enabled: Boolean(tripId),
  });

  const { data: routeDto, isLoading } = useQuery({
    queryKey: ['route', trip?.routeId],
    queryFn: async () => (await api.get<RouteDto>(`/routes/${trip!.routeId}`)).data,
    enabled: Boolean(trip?.routeId),
  });

  const mutation = useMutation({
    mutationFn: async () =>
      (await api.post('/reservations', { tripId, boardingStopId, alightingStopId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      router.replace('/(student)/reservations');
    },
    onError: (err) => setError(extractErrorMessage(err, 'Impossible de créer la réservation')),
  });

  const stops = (routeDto?.stops ?? []).slice().sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const boardingIndex = stops.findIndex((s) => s.stopId === boardingStopId);

  function selectStop(stopId: string) {
    setError(null);
    if (!boardingStopId) {
      setBoardingStopId(stopId);
      return;
    }
    if (!alightingStopId) {
      const index = stops.findIndex((s) => s.stopId === stopId);
      if (index <= boardingIndex) {
        setError('Le point de descente doit être après le point de montée');
        return;
      }
      setAlightingStopId(stopId);
      return;
    }
    // Restart selection
    setBoardingStopId(stopId);
    setAlightingStopId(null);
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="smallBold">Réserver ma place</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {trip && (
        <View style={{ gap: 2 }}>
          <ThemedText type="title" style={{ fontSize: 22, lineHeight: 28 }}>
            {trip.routeName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bus {trip.busPlateNumber} · {trip.driverName}
          </ThemedText>
        </View>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        {!boardingStopId
          ? 'Choisissez votre point de montée'
          : !alightingStopId
            ? 'Choisissez votre point de descente'
            : 'Confirmez votre réservation'}
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <ScrollView contentContainerStyle={{ gap: Spacing.two, paddingBottom: Spacing.four }}>
          {stops.map((stop, index) => {
            const isBoarding = stop.stopId === boardingStopId;
            const isAlighting = stop.stopId === alightingStopId;
            const disabled = Boolean(boardingStopId) && !alightingStopId && index <= boardingIndex;
            return (
              <Pressable
                key={stop.stopId}
                onPress={() => selectStop(stop.stopId)}
                disabled={disabled}
                style={[
                  styles.stopRow,
                  { borderColor: theme.border },
                  (isBoarding || isAlighting) && { borderColor: theme.primary, backgroundColor: theme.backgroundSelected },
                  disabled && { opacity: 0.4 },
                ]}
              >
                <ThemedText type="small">{stop.stopName}</ThemedText>
                {isBoarding && <ThemedText type="small" style={{ color: theme.primary }}>Montée</ThemedText>}
                {isAlighting && <ThemedText type="small" style={{ color: theme.primary }}>Descente</ThemedText>}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error && (
        <ThemedText type="small" themeColor="destructive">
          {error}
        </ThemedText>
      )}

      <Pressable
        onPress={() => mutation.mutate()}
        disabled={!boardingStopId || !alightingStopId || mutation.isPending}
        style={[
          styles.submit,
          { backgroundColor: theme.primary, opacity: !boardingStopId || !alightingStopId || mutation.isPending ? 0.5 : 1 },
        ]}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={theme.primaryForeground} />
        ) : (
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>Confirmer la réservation</ThemedText>
        )}
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  submit: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
