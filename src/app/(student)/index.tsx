import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/status-badge';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Trip } from '@/types';

export default function HorairesScreen() {
  const theme = useTheme();

  const { data: trips, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['trips', 'planned'],
    queryFn: async () => (await api.get<Trip[]>('/trips')).data,
  });

  const upcoming = (trips ?? [])
    .filter((t) => t.status === 'PLANNED' || t.status === 'IN_PROGRESS')
    .sort((a, b) => a.scheduledDeparture.localeCompare(b.scheduledDeparture));

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: Spacing.three, gap: Spacing.one }}>
        <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
          Horaires
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Tournées disponibles à la réservation
        </ThemedText>
      </View>

      <FlatList
        data={upcoming}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.six }}>
              Aucune tournée disponible pour le moment
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="smallBold">{item.routeName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {format(new Date(item.scheduledDeparture), 'EEEE d MMMM · HH:mm', { locale: fr })}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Bus {item.busPlateNumber} · {item.driverName}
              </ThemedText>
              <StatusBadge
                label={item.status === 'IN_PROGRESS' ? 'En cours' : 'Prévue'}
                tone={item.status === 'IN_PROGRESS' ? 'success' : 'neutral'}
              />
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/reserver/[tripId]', params: { tripId: item.id } })}
              style={[styles.reserveButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={{ color: theme.primaryForeground, fontWeight: '700' }} type="small">
                Réserver
              </ThemedText>
            </Pressable>
          </View>
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
  reserveButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
