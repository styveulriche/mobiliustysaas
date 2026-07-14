import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth-store';

export default function ProfilScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  function onLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          clearSession();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
        Profil
      </ThemedText>

      <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={{ color: theme.primaryForeground, fontSize: 22, fontWeight: '800' }}>
            {user ? `${user.firstName[0]}${user.lastName[0]}` : '?'}
          </ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">
            {user ? `${user.firstName} ${user.lastName}` : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.email}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Chauffeur
          </ThemedText>
        </View>
      </View>

      <Pressable onPress={onLogout} style={[styles.logoutRow, { borderColor: theme.border }]}>
        <Ionicons name="log-out-outline" size={20} color={theme.destructive} />
        <ThemedText type="small" style={{ color: theme.destructive }}>
          Se déconnecter
        </ThemedText>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
});
