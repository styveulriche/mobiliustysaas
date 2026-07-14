import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StateStorage } from 'zustand/middleware'

// Expo Router's static web output prerenders each route once in Node (no `window`)
// before ever reaching the browser. AsyncStorage's web shim touches `window`
// unconditionally, so it must be skipped entirely during that SSR pass.
const noopStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
}

// expo-secure-store has no web implementation — fall back to AsyncStorage
// (localStorage-backed on web) so the auth flow also works in `expo start --web`.
export const secureStorage: StateStorage =
  Platform.OS === 'web'
    ? typeof window === 'undefined'
      ? noopStorage
      : {
          getItem: async (name) => (await AsyncStorage.getItem(name)) ?? null,
          setItem: async (name, value) => AsyncStorage.setItem(name, value),
          removeItem: async (name) => AsyncStorage.removeItem(name),
        }
    : {
        getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
        setItem: async (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: async (name) => SecureStore.deleteItemAsync(name),
      }
