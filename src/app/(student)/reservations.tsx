import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { StatusBadge, type BadgeTone } from '@/components/status-badge';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api, extractErrorMessage } from '@/lib/api';
import type { Reservation, ReservationStatus } from '@/types';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  RESERVED: 'Réservée',
  VALIDATED: 'Validée',
  CANCELLED: 'Annulée',
  NO_SHOW: 'Absence',
};

const STATUS_TONE: Record<ReservationStatus, BadgeTone> = {
  RESERVED: 'primary',
  VALIDATED: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'destructive',
};

export default function ReservationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data: reservations, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => (await api.get<Reservation[]>('/reservations/mine')).data,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/reservations/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] }),
    onError: (err) => Alert.alert('Erreur', extractErrorMessage(err, "Impossible d'annuler la réservation")),
  });

  const sorted = (reservations ?? []).slice().sort((a, b) => (a.status === 'RESERVED' ? -1 : 1));

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: Spacing.three, gap: Spacing.one }}>
        <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
          Mes réservations
        </ThemedText>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.six }}>
              Aucune réservation pour le moment
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/qrcode/[reservationId]', params: { reservationId: item.id } })}
            style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          >
            <View style={{ gap: 4 }}>
              <ThemedText type="smallBold">{item.routeName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.boardingStopName} → {item.alightingStopName}
              </ThemedText>
              {item.validatedAt && (
                <ThemedText type="small" themeColor="textSecondary">
                  Validée le {format(new Date(item.validatedAt), "d MMM 'à' HH:mm", { locale: fr })}
                </ThemedText>
              )}
              <StatusBadge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
            </View>
            {item.status === 'RESERVED' && (
              <Pressable
                onPress={() => cancelMutation.mutate(item.id)}
                hitSlop={10}
                style={[styles.cancelButton, { borderColor: theme.destructive }]}
              >
                <ThemedText type="small" style={{ color: theme.destructive }}>
                  Annuler
                </ThemedText>
              </Pressable>
            )}
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
