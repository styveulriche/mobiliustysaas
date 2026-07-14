import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { secureStorage } from '@/lib/secure-storage'
import type { AuthResponse, UserSummary } from '@/types'

interface AuthState {
  tenantCode: string
  accessToken: string | null
  refreshToken: string | null
  user: UserSummary | null
  hasHydrated: boolean
  setTenantCode: (code: string) => void
  setSession: (auth: AuthResponse) => void
  clearSession: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tenantCode: 'IUSTY',
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setTenantCode: (code) => set({ tenantCode: code }),
      setSession: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: auth.user,
        }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'iustybus-mobile-auth',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true })
      },
    },
  ),
)
