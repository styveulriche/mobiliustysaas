import { create } from 'zustand'
import type { TenantPublic } from '@/types'

interface TenantBrandState {
  branding: TenantPublic | null
  setBranding: (branding: TenantPublic | null) => void
}

export const useTenantBrandStore = create<TenantBrandState>()((set) => ({
  branding: null,
  setBranding: (branding) => set({ branding }),
}))
