/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1723',
    background: '#ffffff',
    backgroundElement: '#F4F1FB',
    backgroundSelected: '#EDE7FF',
    textSecondary: '#6E6580',
    primary: '#6C3EF4',
    primaryForeground: '#ffffff',
    border: '#E4E0ED',
    success: '#167A56',
    warning: '#9A6400',
    destructive: '#B23A3A',
  },
  dark: {
    text: '#F1EEF7',
    background: '#16131E',
    backgroundElement: '#221D33',
    backgroundSelected: '#2C2440',
    textSecondary: '#A89FC0',
    primary: '#A688FF',
    primaryForeground: '#16131E',
    border: '#342E46',
    success: '#4FCEA0',
    warning: '#E0AC4B',
    destructive: '#EC8484',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
