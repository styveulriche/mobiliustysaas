import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import type { Reservation, RouteDto, Trip } from '@/types';

export default function StudentScannerScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [boardingStopId, setBoardingStopId] = useState<string | null>(null);
  const [alightingStopId, setAlightingStopId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const busyRef = useRef(false);

  const lookupMutation = useMutation({
    mutationFn: async (scannedCode: string) => (await api.get<Trip>(`/trips/by-code/${scannedCode}`)).data,
    onSuccess: (found) => setTrip(found),
    onError: (err) => {
      setFeedback({ ok: false, text: extractErrorMessage(err, 'QR code invalide') });
      setCode(null);
      busyRef.current = false;
    },
  });

  const { data: route } = useQuery({
    queryKey: ['route', trip?.routeId],
    queryFn: async () => (await api.get<RouteDto>(`/routes/${trip!.routeId}`)).data,
    enabled: !!trip,
  });

  const checkInMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<Reservation>('/reservations/check-in', {
          code,
          boardingStopId,
          alightingStopId,
        })
      ).data,
    onSuccess: (reservation) => {
      setFeedback({
        ok: true,
        text: `Présence enregistrée — ${reservation.boardingStopName} → ${reservation.alightingStopName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
      reset();
    },
    onError: (err) => setFeedback({ ok: false, text: extractErrorMessage(err, "Impossible d'enregistrer votre présence") }),
  });

  function reset() {
    setTrip(null);
    setCode(null);
    setBoardingStopId(null);
    setAlightingStopId(null);
    setTimeout(() => {
      busyRef.current = false;
    }, 1000);
  }

  function onScan(result: BarcodeScanningResult) {
    if (busyRef.current) return;
    busyRef.current = true;
    setFeedback(null);
    setCode(result.data);
    lookupMutation.mutate(result.data);
  }

  if (!permission) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginBottom: Spacing.three }}>
          L'accès à la caméra est nécessaire pour scanner le QR code du bus
        </ThemedText>
        <Pressable onPress={requestPermission} style={[styles.button, { backgroundColor: theme.primary }]}>
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>Autoriser la caméra</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const stopsSorted = (route?.stops ?? []).slice().sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const needsStopPicker = !!trip && !checkInMutation.isSuccess;

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={needsStopPicker ? undefined : onScan}
      />

      {!trip && (
        <View style={styles.overlay}>
          <View style={[styles.frame, { borderColor: theme.primary }]} />
          <ThemedText type="small" style={{ color: '#fff', textAlign: 'center', marginTop: Spacing.three }}>
            Placez le QR code affiché dans le bus dans le cadre
          </ThemedText>
          {lookupMutation.isPending && <ActivityIndicator color="#fff" style={{ marginTop: Spacing.two }} />}
        </View>
      )}

      {needsStopPicker && (
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={{ gap: Spacing.three }}>
            <ThemedText type="smallBold">{trip.routeName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Bus {trip.busPlateNumber} · {trip.driverName}
            </ThemedText>

            <ThemedText type="smallBold">Montée</ThemedText>
            <View style={styles.chipsRow}>
              {stopsSorted.map((s) => (
                <Pressable
                  key={'board-' + s.stopId}
                  onPress={() => setBoardingStopId(s.stopId)}
                  style={[
                    styles.chip,
                    { borderColor: theme.border, backgroundColor: boardingStopId === s.stopId ? theme.primary : 'transparent' },
                  ]}
                >
                  <ThemedText type="small" style={{ color: boardingStopId === s.stopId ? theme.primaryForeground : theme.text }}>
                    {s.stopName}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="smallBold">Descente</ThemedText>
            <View style={styles.chipsRow}>
              {stopsSorted.map((s) => (
                <Pressable
                  key={'alight-' + s.stopId}
                  onPress={() => setAlightingStopId(s.stopId)}
                  style={[
                    styles.chip,
                    { borderColor: theme.border, backgroundColor: alightingStopId === s.stopId ? theme.primary : 'transparent' },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{ color: alightingStopId === s.stopId ? theme.primaryForeground : theme.text }}
                  >
                    {s.stopName}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {feedback && !feedback.ok && (
              <ThemedText type="small" themeColor="destructive">
                {feedback.text}
              </ThemedText>
            )}

            <View style={{ flexDirection: 'row', gap: Spacing.two }}>
              <Pressable onPress={reset} style={[styles.button, { flex: 1, backgroundColor: theme.border }]}>
                <ThemedText style={{ fontWeight: '700' }}>Annuler</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending || !boardingStopId || !alightingStopId}
                style={[styles.button, { flex: 1, backgroundColor: theme.primary, opacity: !boardingStopId || !alightingStopId ? 0.5 : 1 }]}
              >
                <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>
                  {checkInMutation.isPending ? 'Validation…' : 'Confirmer'}
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {feedback && !trip && (
        <View style={[styles.feedback, { backgroundColor: feedback.ok ? theme.success : theme.destructive }]}>
          <ThemedText style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>
            {feedback.ok ? 'Présence validée' : 'Échec'}
          </ThemedText>
          <ThemedText type="small" style={{ color: '#ffffffdd', textAlign: 'center' }}>
            {feedback.text}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  button: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 240, borderWidth: 3, borderRadius: 20 },
  feedback: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.four,
    borderRadius: 14,
    padding: Spacing.three,
    gap: 4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
});
