/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTenantBrandStore } from '@/store/tenant-brand-store';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;
  const primaryColor = useTenantBrandStore((s) => s.branding?.primaryColor);

  if (primaryColor) {
    return { ...Colors[theme], primary: primaryColor, primaryForeground: '#ffffff' };
  }
  return Colors[theme];
}
