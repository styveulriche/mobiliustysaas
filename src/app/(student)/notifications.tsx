import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { NotificationItem } from '@/types';

export default function NotificationsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<NotificationItem[]>('/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <ScreenContainer style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: Spacing.three, gap: Spacing.one }}>
        <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
          Notifications
        </ThemedText>
      </View>

      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.six }}>
              Aucune notification
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.read && markRead.mutate(item.id)}
            style={{
              borderWidth: 1,
              borderRadius: 14,
              padding: Spacing.three,
              gap: 4,
              borderColor: theme.border,
              backgroundColor: item.read ? theme.background : theme.backgroundElement,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!item.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />}
              <ThemedText type="smallBold">{item.title}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {item.message}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr })}
            </ThemedText>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
