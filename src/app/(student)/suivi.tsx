import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LeafletMapView, type LeafletMarker, type MapType } from '@/components/leaflet-map';
import { MapTypeToggle } from '@/components/map-type-toggle';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useMyLocation } from '@/hooks/use-my-location';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import { splitRouteProgress } from '@/lib/geo';
import { useTripPosition } from '@/lib/ws';
import type { BusProximity, Reservation, RouteDto, Trip } from '@/types';

const YAOUNDE_CENTER = { latitude: 3.848, longitude: 11.502 };

const PROXIMITY_LABEL: Record<BusProximity['proximityStatus'], string> = {
  NOT_STARTED: 'Pas encore parti',
  APPROACHING: "En approche",
  AT_STOP: "À l'arrêt",
  PASSED: 'Déjà passé',
};

export default function SuiviScreen() {
  const theme = useTheme();
  const [hailed, setHailed] = useState(false);
  const [mapType, setMapType] = useState<MapType>('street');
  const myLocation = useMyLocation();

  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => (await api.get<Reservation[]>('/reservations/mine')).data,
  });

  const { data: trips } = useQuery({
    queryKey: ['trips', 'planned'],
    queryFn: async () => (await api.get<Trip[]>('/trips')).data,
    refetchInterval: 15_000,
  });

  const activeReservations = useMemo(
    () => (reservations ?? []).filter((r) => r.status === 'RESERVED' || r.status === 'VALIDATED'),
    [reservations],
  );

  const activeTrip = useMemo(() => {
    const activeTripIds = new Set(activeReservations.map((r) => r.tripId));
    return (trips ?? []).find((t) => t.status === 'IN_PROGRESS' && activeTripIds.has(t.id)) ?? null;
  }, [trips, activeReservations]);

  const activeReservation = useMemo(
    () => activeReservations.find((r) => r.tripId === activeTrip?.id) ?? null,
    [activeReservations, activeTrip],
  );

  const { data: route } = useQuery({
    queryKey: ['route', activeTrip?.routeId],
    queryFn: async () => (await api.get<RouteDto>(`/routes/${activeTrip!.routeId}`)).data,
    enabled: !!activeTrip,
  });

  const { data: nearbyBuses } = useQuery({
    queryKey: ['nearby-buses', activeReservation?.alightingStopId],
    queryFn: async () => (await api.get<BusProximity[]>(`/stops/${activeReservation!.alightingStopId}/nearby-buses`)).data,
    enabled: !!activeReservation,
    refetchInterval: 10_000,
  });

  const proximity = nearbyBuses?.find((b) => b.tripId === activeTrip?.id) ?? null;

  const position = useTripPosition(activeTrip?.id ?? null);

  const hailMutation = useMutation({
    mutationFn: async (tripId: string) => api.post(`/trips/${tripId}/hail`),
    onSuccess: () => {
      setHailed(true);
      Alert.alert('Signal envoyé', 'Le chauffeur a été prévenu que vous souhaitez vous arrêter.');
    },
    onError: (err) => Alert.alert('Erreur', extractErrorMessage(err, "Impossible d'envoyer le signal")),
  });

  const center = position ? { latitude: position.latitude, longitude: position.longitude } : myLocation ?? YAOUNDE_CENTER;
  const stopsSorted = (route?.stops ?? []).slice().sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const busPosition = position ? { latitude: position.latitude, longitude: position.longitude } : null;
  const { traveled, remaining } = splitRouteProgress(stopsSorted, busPosition);

  const markers: LeafletMarker[] = [
    ...(position && activeTrip
      ? [{ id: 'bus', latitude: position.latitude, longitude: position.longitude, title: activeTrip.busPlateNumber, variant: 'bus' as const, heading: position.heading }]
      : []),
    ...(myLocation
      ? [{ id: 'me', latitude: myLocation.latitude, longitude: myLocation.longitude, title: 'Ma position', variant: 'user' as const, heading: myLocation.heading }]
      : []),
  ];

  return (
    <View style={styles.flex}>
      <LeafletMapView
        style={styles.flex}
        center={center}
        zoom={15}
        mapType={mapType}
        markers={markers}
        traveledPolyline={traveled}
        remainingPolyline={remaining}
      />
      <MapTypeToggle mapType={mapType} onChange={setMapType} />

      {activeTrip ? (
        <View style={styles.banner}>
          <ThemedText type="smallBold">{activeTrip.routeName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bus {activeTrip.busPlateNumber} · {activeTrip.driverName}
            {position?.speedKmh != null ? ` · ${position.speedKmh.toFixed(0)} km/h` : ''}
            {position?.distanceTraveledKm != null ? ` · ${position.distanceTraveledKm.toFixed(1)} km parcourus` : ''}
          </ThemedText>
          {proximity && (
            <ThemedText type="small" themeColor="textSecondary">
              {PROXIMITY_LABEL[proximity.proximityStatus]}
              {proximity.distanceMeters != null ? ` · ${(proximity.distanceMeters / 1000).toFixed(1)} km de votre arrêt` : ''}
            </ThemedText>
          )}
          <Pressable
            disabled={hailMutation.isPending || hailed}
            onPress={() => hailMutation.mutate(activeTrip.id)}
            style={[styles.hailButton, { backgroundColor: hailed ? theme.border : theme.primary }]}
          >
            <ThemedText style={{ color: hailed ? theme.textSecondary : theme.primaryForeground, fontWeight: '700' }}>
              {hailed ? 'Signal envoyé' : 'Signaler mon arrêt'}
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.banner}>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Aucun trajet en cours pour le moment.{'\n'}Le suivi en direct apparaît dès que votre bus démarre sa tournée.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.four,
    backgroundColor: '#ffffffee',
    borderRadius: 14,
    padding: Spacing.three,
    gap: 2,
  },
  hailButton: {
    marginTop: Spacing.two,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
