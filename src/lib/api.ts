import { Platform } from 'react-native'
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth-store'
import type { AuthResponse } from '@/types'

// The Android emulator's `localhost` refers to the emulator itself, not the host
// machine — `10.0.2.2` is the documented alias for the host. iOS simulator and web
// both share the host's network, so plain `localhost` works there. Override with
// EXPO_PUBLIC_API_URL for a physical device on the same Wi-Fi (use the host's LAN IP).
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_HOST}:8080/api/v1`

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const { accessToken, tenantCode } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  if (tenantCode) {
    config.headers['X-Tenant-Code'] = tenantCode
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    })
    setSession(data)
    return data.accessToken
  } catch {
    clearSession()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      useAuthStore.getState().clearSession()
    }
    return Promise.reject(error)
  },
)

export function extractErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message
  }
  return fallback
}
