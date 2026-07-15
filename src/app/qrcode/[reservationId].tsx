import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Reservation } from '@/types';

export default function QrCodeScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const theme = useTheme();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => (await api.get<Reservation[]>('/reservations/mine')).data,
  });

  const reservation = reservations?.find((r) => r.id === reservationId);

  return (
    <ScreenContainer style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: 'absolute', top: Spacing.three, left: Spacing.three }}
      >
        <Ionicons name="chevron-back" size={24} color={theme.text} />
      </Pressable>

      {isLoading && <ActivityIndicator />}

      {!isLoading && !reservation && (
        <ThemedText type="small" themeColor="textSecondary">
          Réservation introuvable
        </ThemedText>
      )}

      {reservation && (
        <View style={{ alignItems: 'center', gap: Spacing.three }}>
          <ThemedText type="title" style={{ fontSize: 22, lineHeight: 28 }}>
            {reservation.routeName}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            {reservation.boardingStopName} → {reservation.alightingStopName}
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', maxWidth: 280 }}>
            Votre place est réservée. Pour valider votre présence à bord, scannez le QR code affiché à l'entrée
            du bus depuis l'onglet "Scanner".
          </ThemedText>
        </View>
      )}
    </ScreenContainer>
  );
}
