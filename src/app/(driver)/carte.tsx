import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { useTripPosition } from '@/lib/ws';
import type { RouteDto, Trip } from '@/types';

const YAOUNDE_CENTER = { latitude: 3.848, longitude: 11.502 };

export default function CarteScreen() {
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
  const center = position
    ? { latitude: position.latitude, longitude: position.longitude }
    : stopsSorted[0]
      ? { latitude: stopsSorted[0].latitude, longitude: stopsSorted[0].longitude }
      : YAOUNDE_CENTER;

  return (
    <View style={styles.flex}>
      <MapView style={styles.flex} initialRegion={{ ...center, latitudeDelta: 0.08, longitudeDelta: 0.08 }}>
        {stopsSorted.length > 1 && (
          <Polyline
            coordinates={stopsSorted.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))}
            strokeWidth={4}
          />
        )}
        {stopsSorted.map((s) => (
          <Marker key={s.stopId} coordinate={{ latitude: s.latitude, longitude: s.longitude }} title={s.stopName} pinColor="orange" />
        ))}
        {position && (
          <Marker
            coordinate={{ latitude: position.latitude, longitude: position.longitude }}
            title={activeTrip.busPlateNumber}
            pinColor="#208AEF"
          />
        )}
      </MapView>

      <View style={styles.banner}>
        <ThemedText type="smallBold">{activeTrip.routeName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Bus {activeTrip.busPlateNumber}
          {position?.speedKmh != null ? ` · ${position.speedKmh.toFixed(0)} km/h` : ''}
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
