import { ChevronRight, LogOut } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { NavIcon } from '@/components/layout/NavIcon'
import { OrgSwitcher } from '@/components/layout/OrgSwitcher'
import { Avatar, PageTitle } from '@/components/ui'
import { ROLE_LABELS } from '@/config/sales'
import { signOut, switchOrg } from '@/features/auth/actions'
import { getSession, isPlatformAdmin } from '@/lib/session'

export const metadata: Metadata = { title: 'Más' }

const LINKS = [
  { id: 'conocimiento', label: 'Lo que Momo sabe', description: 'Políticas, productos, dudas y personalidad', href: '/conocimiento' },
  { id: 'resultados', label: 'Resultados', description: 'Ventas, conversaciones y canales', href: '/resultados' },
  { id: 'ajustes', label: 'Ajustes', description: 'Perfil, contraseña, equipo, plan y canales', href: '/ajustes' },
] as const

/** Menú "Más" del celular: lo que no cabe en la barra inferior. */
export default async function MasPage() {
  const session = await getSession()
  const admin = await isPlatformAdmin()
  const orgs = session.memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))
  const row = 'flex min-h-16 items-center gap-4 rounded-3xl border border-line bg-white p-4 hover:border-brand-200'

  return (
    <div className="space-y-5">
      <PageTitle title="Más" />
      <div className="flex items-center gap-3 rounded-3xl bg-brand-50 p-4">
        <Avatar name={session.user.name} className="bg-brand-600 text-white" />
        <div className="min-w-0"><p className="truncate font-extrabold">{session.user.name}</p><p className="text-sm text-muted">{ROLE_LABELS[session.role]} · {session.org.name}</p></div>
      </div>
      {orgs.length > 1 && <OrgSwitcher current={session.org.id} orgs={orgs} action={switchOrg} />}
      <ul className="space-y-2">
        {LINKS.map((l) => (
          <li key={l.id}>
            <Link href={l.href} className={row}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><NavIcon id={l.id} /></span>
              <span className="min-w-0 flex-1"><span className="block font-extrabold">{l.label}</span><span className="block text-sm text-muted">{l.description}</span></span>
              <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
        {admin && (
          <li>
            <Link href="/admin" className={row}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white"><NavIcon id="admin" /></span>
              <span className="min-w-0 flex-1"><span className="block font-extrabold">Administración</span><span className="block text-sm text-muted">Área exclusiva del dueño de Momo AI</span></span>
              <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
            </Link>
          </li>
        )}
      </ul>
      <form action={signOut}>
        <button type="submit" className="flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl border border-line bg-white font-extrabold text-danger">
          <LogOut className="h-5 w-5" aria-hidden />Cerrar sesión
        </button>
      </form>
    </div>
  )
}
