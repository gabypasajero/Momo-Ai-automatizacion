import { Sidebar } from '@/components/layout/Sidebar'
import { SubNav } from '@/components/layout/SubNav'
import { Topbar } from '@/components/layout/Topbar'
import { getRepository } from '@/lib/data'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // TODO(auth): exigir sesión de Supabase y resolver la organización del usuario.
  const organization = await getRepository().getOrganization()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <SubNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar organizationName={organization.name} userInitials="GP" />
        <main className="scroll-thin min-h-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  )
}
