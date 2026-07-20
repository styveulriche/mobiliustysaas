import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useTenantBrandStore } from '@/store/tenant-brand-store'
import type { TenantPublic } from '@/types'

/** Fetches the current tenant's public branding (logo/name/tagline/color) and syncs it into
 * tenant-brand-store — called once, at the app root, so every screen can read it. */
export function useLoadTenantBranding() {
  const tenantCode = useAuthStore((s) => s.tenantCode)
  const setBranding = useTenantBrandStore((s) => s.setBranding)

  const { data } = useQuery({
    queryKey: ['public-tenant', tenantCode],
    queryFn: async () => (await api.get<TenantPublic>(`/public/tenants/${tenantCode}`)).data,
    enabled: Boolean(tenantCode),
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    setBranding(data ?? null)
  }, [data, setBranding])
}
