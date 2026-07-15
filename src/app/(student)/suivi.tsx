import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import { useTripPosition } from '@/lib/ws';
import type { Reservation, Trip } from '@/types';

const YAOUNDE_CENTER = { latitude: 3.848, longitude: 11.502 };

export default function SuiviScreen() {
  const theme = useTheme();
  const [hailed, setHailed] = useState(false);
  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => (await api.get<Reservation[]>('/reservations/mine')).data,
  });

  const { data: trips } = useQuery({
    queryKey: ['trips', 'planned'],
    queryFn: async () => (await api.get<Trip[]>('/trips')).data,
    refetchInterval: 15_000,
  });

  const activeTrip = useMemo(() => {
    const activeReservations = new Set(
      (reservations ?? []).filter((r) => r.status === 'RESERVED' || r.status === 'VALIDATED').map((r) => r.tripId),
    );
    return (trips ?? []).find((t) => t.status === 'IN_PROGRESS' && activeReservations.has(t.id)) ?? null;
  }, [reservations, trips]);

  const position = useTripPosition(activeTrip?.id ?? null);

  const hailMutation = useMutation({
    mutationFn: async (tripId: string) => api.post(`/trips/${tripId}/hail`),
    onSuccess: () => {
      setHailed(true);
      Alert.alert('Signal envoyé', 'Le chauffeur a été prévenu que vous souhaitez vous arrêter.');
    },
    onError: (err) => Alert.alert('Erreur', extractErrorMessage(err, "Impossible d'envoyer le signal")),
  });

  if (!activeTrip) {
    return (
      <ScreenContainer style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Aucun trajet en cours pour le moment.{'\n'}Le suivi apparaît dès que votre bus démarre sa tournée.
        </ThemedText>
      </ScreenContainer>
    );
  }

  const center = position ? { latitude: position.latitude, longitude: position.longitude } : YAOUNDE_CENTER;

  return (
    <View style={styles.flex}>
      <MapView
        style={styles.flex}
        initialRegion={{ ...center, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        region={position ? { ...center, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined}
      >
        {position && (
          <Marker coordinate={{ latitude: position.latitude, longitude: position.longitude }} title={activeTrip.busPlateNumber} />
        )}
      </MapView>

      <View style={styles.banner}>
        <ThemedText type="smallBold">{activeTrip.routeName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Bus {activeTrip.busPlateNumber} · {activeTrip.driverName}
          {position?.speedKmh != null ? ` · ${position.speedKmh.toFixed(0)} km/h` : ''}
        </ThemedText>
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
