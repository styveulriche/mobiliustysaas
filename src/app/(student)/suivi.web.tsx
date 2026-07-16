import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

// react-native-webview has no web target — the live map only renders on iOS/Android.
export default function SuiviWebScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="phone-portrait-outline" size={40} color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
        Le suivi en direct est disponible sur l'application mobile (iOS/Android)
      </ThemedText>
    </ScreenContainer>
  );
}
