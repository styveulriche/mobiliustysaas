import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LeafletMapView, type LeafletMarker, type MapType } from '@/components/leaflet-map';
import { MapTypeToggle } from '@/components/map-type-toggle';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { splitRouteProgress } from '@/lib/geo';
import { useTripPosition } from '@/lib/ws';
import type { RouteDto, Trip } from '@/types';

const YAOUNDE_CENTER = { latitude: 3.848, longitude: 11.502 };

export default function CarteScreen() {
  const [mapType, setMapType] = useState<MapType>('street');

  const { data: trips } = useQuery({
    queryKey: ['trips', 'mine'],
    queryFn: async () => (await api.get<Trip[]>('/trips')).data,
    refetchInterval: 15_000,
  });

  const activeTrip = useMemo(
    () => trips?.find((t) => t.status === 'IN_PROGRESS') ?? trips?.find((t) => t.status === 'PLANNED') ?? null,
    [trips],
  );

  const { data: route } = useQuery({
    queryKey: ['route', activeTrip?.routeId],
    queryFn: async () => (await api.get<RouteDto>(`/routes/${activeTrip!.routeId}`)).data,
    enabled: !!activeTrip,
  });

  const position = useTripPosition(activeTrip?.status === 'IN_PROGRESS' ? activeTrip.id : null);

  if (!activeTrip) {
    return (
      <ScreenContainer style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Aucune tournée assignée pour le moment.
        </ThemedText>
      </ScreenContainer>
    );
  }

  const stopsSorted = (route?.stops ?? []).slice().sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const busPosition = position ? { latitude: position.latitude, longitude: position.longitude } : null;
  const center = busPosition ?? (stopsSorted[0] ? { latitude: stopsSorted[0].latitude, longitude: stopsSorted[0].longitude } : YAOUNDE_CENTER);
  const { traveled, remaining } = splitRouteProgress(stopsSorted, busPosition);

  const markers: LeafletMarker[] = [
    ...stopsSorted.map((s) => ({ id: s.stopId, latitude: s.latitude, longitude: s.longitude, title: s.stopName, color: '#f59e0b' })),
    ...(position
      ? [{ id: 'bus', latitude: position.latitude, longitude: position.longitude, title: activeTrip.busPlateNumber, variant: 'bus' as const, heading: position.heading }]
      : []),
  ];

  return (
    <View style={styles.flex}>
      <LeafletMapView
        style={styles.flex}
        center={center}
        zoom={13}
        mapType={mapType}
        markers={markers}
        traveledPolyline={traveled}
        remainingPolyline={remaining}
      />
      <MapTypeToggle mapType={mapType} onChange={setMapType} />

      <View style={styles.banner}>
        <ThemedText type="smallBold">{activeTrip.routeName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Bus {activeTrip.busPlateNumber}
          {position?.speedKmh != null ? ` · ${position.speedKmh.toFixed(0)} km/h` : ''}
          {position?.distanceTraveledKm != null ? ` · ${position.distanceTraveledKm.toFixed(1)} km parcourus` : ''}
        </ThemedText>
      </View>
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
});
