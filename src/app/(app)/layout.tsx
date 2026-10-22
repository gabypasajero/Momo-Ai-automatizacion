import { Building2 } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SubNav, SubNavTabs } from '@/components/layout/SubNav'
import { Topbar } from '@/components/layout/Topbar'
import { Button, EmptyState } from '@/components/ui'
import { MomoCompanion } from '@/features/assistant/MomoCompanion'
import { signOut } from '@/features/auth/actions'
import { NoOrganizationError, getCurrentUser, getRepository } from '@/lib/data'
import type { Organization } from '@/lib/data'

const initials = (text: string) =>
  text.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || 'M'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let organization: Organization
  try {
    organization = await (await getRepository()).getOrganization()
  } catch (error) {
    if (!(error instanceof NoOrganizationError)) throw error
    return (
      <main className="p-4">
        <EmptyState icon={Building2} title="Tu cuenta aún no tiene empresa"
          description="Pide al administrador de tu empresa que te agregue como miembro en Momo."
          action={<form action={signOut}><Button type="submit">Cerrar sesión</Button></form>} />
      </main>
    )
  }

  const user = await getCurrentUser()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <SubNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          organizationName={organization.name}
          userInitials={initials(user?.name ?? 'Gaby Pasajero')}
          signOutAction={user ? signOut : undefined}
        />
        <SubNavTabs />
        <main className="scroll-thin min-h-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
      <MomoCompanion />
    </div>
  )
}
