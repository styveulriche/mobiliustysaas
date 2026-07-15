import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, API_BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { Trip } from '@/types';

export default function BoardingQrScreen() {
  const theme = useTheme();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [downloading, setDownloading] = useState(false);

  const { data: trips } = useQuery({
    queryKey: ['trips', 'mine'],
    queryFn: async () => (await api.get<Trip[]>('/trips')).data,
  });
  const activeTrip = trips?.find((t) => t.status === 'IN_PROGRESS') ?? trips?.find((t) => t.status === 'PLANNED') ?? null;

  const { data: boardingCode, isLoading } = useQuery({
    queryKey: ['boarding-code', activeTrip?.id],
    queryFn: async () =>
      (await api.get<{ tripId: string; code: string }>(`/trips/${activeTrip!.id}/boarding-code`)).data.code,
    enabled: !!activeTrip,
  });

  async function downloadPdf() {
    if (!activeTrip) return;
    setDownloading(true);
    try {
      const fileUri = FileSystem.documentDirectory + `tournee-${activeTrip.busPlateNumber}.pdf`;
      const result = await FileSystem.downloadAsync(
        `${API_BASE_URL}/trips/${activeTrip.id}/boarding-pass.pdf`,
        fileUri,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf' });
      } else {
        Alert.alert('PDF téléchargé', result.uri);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de télécharger le PDF');
    } finally {
      setDownloading(false);
    }
  }

  if (!activeTrip) {
    return (
      <ScreenContainer style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Aucune tournée assignée pour le moment.
        </ThemedText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={{ alignItems: 'center', justifyContent: 'center', gap: Spacing.four }}>
      <ThemedText type="title" style={{ fontSize: 22, lineHeight: 28, textAlign: 'center' }}>
        {activeTrip.routeName}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Bus {activeTrip.busPlateNumber}
      </ThemedText>

      <View style={[styles.qrBox, { backgroundColor: '#ffffff' }]}>
        {isLoading || !boardingCode ? <ActivityIndicator /> : <QRCode value={boardingCode} size={220} />}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', maxWidth: 280 }}>
        Chaque étudiant scanne ce code pour valider sa présence à bord. Téléchargez le PDF pour l'imprimer et le
        coller à l'entrée du bus.
      </ThemedText>

      <Pressable
        onPress={downloadPdf}
        disabled={downloading}
        style={[styles.button, { backgroundColor: theme.primary, opacity: downloading ? 0.7 : 1 }]}
      >
        <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }}>
          {downloading ? 'Téléchargement…' : 'Télécharger le PDF'}
        </ThemedText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  qrBox: { padding: Spacing.four, borderRadius: 20 },
  button: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14 },
});
