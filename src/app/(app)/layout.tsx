import { KeyRound } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/layout/BottomNav'
import { OrgSwitcher } from '@/components/layout/OrgSwitcher'
import { Sidebar } from '@/components/layout/Sidebar'
import { Mascot } from '@/components/brand'
import { ButtonLink } from '@/components/ui'
import { ROLE_LABELS } from '@/config/sales'
import { MomoCompanion } from '@/features/assistant/MomoCompanion'
import { signOut, switchOrg } from '@/features/auth/actions'
import { countWaiting } from '@/features/conversaciones/queries'
import { NoOrganizationError, NotConfiguredError, getSession, isPlatformAdmin } from '@/lib/session'

// Todo el panel depende de la sesión: nunca se genera como página estática.
export const dynamic = 'force-dynamic'

function Notice({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center">
        <Mascot variant="full" className="mx-auto h-28 w-auto" title="" />
        <h1 className="mt-3 font-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted">{description}</p>
        {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
      </div>
    </main>
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let session
  try {
    session = await getSession()
  } catch (error) {
    if (error instanceof NotConfiguredError) {
      return <Notice title="Falta conectar la base de datos" description="Configura las variables de Supabase del proyecto para usar Momo." />
    }
    if (!(error instanceof NoOrganizationError)) throw error
    return (
      <Notice title="Tu cuenta aún no tiene empresa" description="Pide al dueño de tu empresa que te sume al equipo desde Ajustes › Equipo.">
        <form action={signOut}><button type="submit" className="rounded-full border border-line px-5 py-2.5 font-bold">Cerrar sesión</button></form>
      </Notice>
    )
  }

  const [waiting, showAdmin] = await Promise.all([countWaiting(session), isPlatformAdmin()])

  if (session.org.status === 'suspendida') {
    return (
      <Notice title="Cuenta suspendida" description={`La cuenta de ${session.org.name} está suspendida. Escríbenos para reactivarla.`}>
        {session.memberships.length > 1 && (
          <OrgSwitcher current={session.org.id} orgs={session.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))} action={switchOrg} className="w-full text-left" />
        )}
        {showAdmin && <ButtonLink href="/admin" variant="primary">Ir a Administración</ButtonLink>}
        <form action={signOut}><button type="submit" className="min-h-11 rounded-full border border-line px-5 font-bold">Cerrar sesión</button></form>
      </Notice>
    )
  }

  const orgs = session.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))
  return (
    <div className="min-h-screen md:flex">
      <Sidebar orgId={session.org.id} orgName={session.org.name} orgs={orgs} userName={session.user.name}
        roleLabel={ROLE_LABELS[session.role]} waiting={waiting} showAdmin={showAdmin} switchOrg={switchOrg} signOut={signOut} />
      <div className="min-w-0 flex-1 pb-40 md:pb-0">
        {session.user.mustChangePassword && (
          <div role="status" className="flex flex-wrap items-center gap-3 bg-accent-soft px-4 py-3 text-sm text-accent-strong md:px-8">
            <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1 font-semibold">Estás usando una contraseña temporal. Cámbiala por una que solo tú conozcas.</span>
            <Link href="/ajustes?t=perfil#contrasena" className="font-extrabold underline">Cambiar ahora</Link>
          </div>
        )}
        <main id="contenido" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <BottomNav waiting={waiting} />
      <MomoCompanion />
    </div>
  )
}
