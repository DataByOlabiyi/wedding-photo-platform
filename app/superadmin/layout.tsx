import { requirePlatformAdmin } from '@/lib/auth'

// Layouts do not re-run on soft navigation and route.ts handlers bypass them:
// every future page.tsx or route.ts under /superadmin must call
// requirePlatformAdmin() (or a stricter guard) itself.
export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin()
  return children
}
