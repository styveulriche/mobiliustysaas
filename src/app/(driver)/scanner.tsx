import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useMutation } from '@tanstack/react-query';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import type { Reservation } from '@/types';

export default function ScannerScreen() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const busyRef = useRef(false);

  const validateMutation = useMutation({
    mutationFn: async (qrCode: string) => (await api.post<Reservation>('/reservations/validate-qr', { qrCode })).data,
    onSuccess: (reservation) => {
      setFeedback({ ok: true, text: `${reservation.studentName} — ${reservation.boardingStopName} → ${reservation.alightingStopName}` });
    },
    onError: (err) => setFeedback({ ok: false, text: extractErrorMessage(err, 'QR code invalide ou déjà utilisé') }),
    onSettled: () => {
      setTimeout(() => {
        busyRef.current = false;
      }, 2000);
    },
  });

  function onScan(result: BarcodeScanningResult) {
    if (busyRef.current) return;
    busyRef.current = true;
    setFeedback(null);
    validateMutation.mutate(result.data);
  }

  if (!permission) {
    return <ThemedView style={{ flex: 1 }} />;
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginBottom: Spacing.three }}>
          L'accès à la caméra est nécessaire pour scanner les QR codes des étudiants
        </ThemedText>
        <Pressable onPress={requestPermission} style={[styles.button, { backgroundColor: theme.primary }]}>
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>Autoriser la caméra</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScan}
      />
      <View style={styles.overlay}>
        <View style={[styles.frame, { borderColor: theme.primary }]} />
        <ThemedText type="small" style={{ color: '#fff', textAlign: 'center', marginTop: Spacing.three }}>
          Placez le QR code de l'étudiant dans le cadre
        </ThemedText>
      </View>

      {feedback && (
        <View
          style={[
            styles.feedback,
            { backgroundColor: feedback.ok ? theme.success : theme.destructive },
          ]}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>
            {feedback.ok ? 'Embarquement validé' : 'Échec de la validation'}
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
  button: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
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
});
