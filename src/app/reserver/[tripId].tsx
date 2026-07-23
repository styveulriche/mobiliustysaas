import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LeafletMapView, type LeafletMarker } from '@/components/leaflet-map';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useMyLocation } from '@/hooks/use-my-location';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import { nearestIndex } from '@/lib/geo';
import type { RouteDto, Trip } from '@/types';

const YAOUNDE_CENTER = { latitude: 3.848, longitude: 11.502 };

export default function ReserverScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const myLocation = useMyLocation();

  const [boardingStopId, setBoardingStopId] = useState<string | null>(null);
  const [alightingStopId, setAlightingStopId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
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
  const boardingStop = stops.find((s) => s.stopId === boardingStopId) ?? null;
  const alightingStop = stops.find((s) => s.stopId === alightingStopId) ?? null;

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

  // Pre-select the boarding stop closest to the student's current position, once available.
  useEffect(() => {
    if (autoSelected || boardingStopId || !myLocation || stops.length === 0) return;
    const index = nearestIndex(myLocation, stops);
    if (index >= 0) {
      setAutoSelected(true);
      selectStop(stops[index].stopId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLocation, stops.length, autoSelected, boardingStopId]);

  function handleMapPress(coords: { latitude: number; longitude: number }) {
    if (stops.length === 0) return;
    const index = nearestIndex(coords, stops);
    if (index >= 0) selectStop(stops[index].stopId);
  }

  const mapCenter = myLocation ?? (stops[0] ? { latitude: stops[0].latitude, longitude: stops[0].longitude } : YAOUNDE_CENTER);

  const markers: LeafletMarker[] = [
    ...stops.map((s) => ({
      id: s.stopId,
      latitude: s.latitude,
      longitude: s.longitude,
      title: s.stopName,
      color: s.stopId === boardingStopId ? '#16a34a' : s.stopId === alightingStopId ? '#dc2626' : '#f59e0b',
    })),
    ...(myLocation
      ? [{ id: 'me', latitude: myLocation.latitude, longitude: myLocation.longitude, title: 'Ma position', variant: 'user' as const, heading: myLocation.heading }]
      : []),
  ];

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
          ? 'Touchez la carte à votre point de départ'
          : !alightingStopId
            ? 'Touchez la carte à votre point d\'arrivée'
            : 'Confirmez votre réservation'}
      </ThemedText>

      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          <View style={styles.mapWrap}>
            <LeafletMapView
              style={styles.flex}
              center={mapCenter}
              zoom={14}
              markers={markers}
              remainingPolyline={stops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))}
              onMapPress={handleMapPress}
            />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
            {!boardingStopId
              ? ' '
              : !alightingStopId
                ? `Arrêt de montée le plus proche : ${boardingStop?.stopName ?? ''}`
                : `Montée : ${boardingStop?.stopName ?? ''} · Descente : ${alightingStop?.stopName ?? ''}`}
          </ThemedText>

          <ScrollView contentContainerStyle={{ gap: Spacing.two, paddingTop: Spacing.two, paddingBottom: Spacing.four }}>
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
        </>
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
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapWrap: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
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
