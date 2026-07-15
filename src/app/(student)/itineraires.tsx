import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { StatusBadge, type BadgeTone } from '@/components/status-badge';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { BusProximity, StopDto } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  APPROACHING: 'En approche',
  AT_STOP: 'À votre arrêt',
  NOT_STARTED: "Pas encore parti",
  PASSED: 'Déjà passé',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  APPROACHING: 'success',
  AT_STOP: 'success',
  NOT_STARTED: 'neutral',
  PASSED: 'destructive',
};

export default function ItinerairesScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState<StopDto | null>(null);

  const { data: stops } = useQuery({
    queryKey: ['stops'],
    queryFn: async () => (await api.get<StopDto[]>('/stops')).data,
  });

  const filteredStops = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return (stops ?? []).filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, stops]);

  const { data: buses, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['nearby-buses', destination?.id],
    queryFn: async () => (await api.get<BusProximity[]>(`/stops/${destination!.id}/nearby-buses`)).data,
    enabled: !!destination,
    refetchInterval: 15_000,
  });

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
        <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
          Où allez-vous ?
        </ThemedText>
        <TextInput
          value={destination ? destination.name : search}
          onChangeText={(v) => {
            setDestination(null);
            setSearch(v);
          }}
          placeholder="Rechercher votre destination…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />

        {!destination && filteredStops.length > 0 && (
          <View style={[styles.suggestions, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            {filteredStops.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setDestination(s);
                  setSearch('');
                }}
                style={styles.suggestionRow}
              >
                <ThemedText type="small">{s.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {destination && (
        <FlatList
          data={buses ?? []}
          keyExtractor={(item) => item.tripId}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            !isLoading ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.six }}>
                Aucun bus ne dessert cet arrêt aujourd'hui
              </ThemedText>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText type="smallBold">{item.routeName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Bus {item.busPlateNumber} · {item.driverName}
                </ThemedText>
                {item.proximityStatus === 'APPROACHING' && item.stopsAway != null && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.stopsAway} arrêt{item.stopsAway > 1 ? 's' : ''} avant le vôtre
                  </ThemedText>
                )}
                {item.proximityStatus === 'PASSED' && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Ce bus a déjà dépassé votre arrêt
                  </ThemedText>
                )}
              </View>
              <StatusBadge label={STATUS_LABEL[item.proximityStatus]} tone={STATUS_TONE[item.proximityStatus]} />
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
  },
});
