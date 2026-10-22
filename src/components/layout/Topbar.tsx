'use client'

import { Bell, ClipboardList, KeyRound, LogOut, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { findModule } from '@/config/navigation'

export function Topbar({ organizationName, userInitials, signOutAction }: {
  organizationName: string
  userInitials: string
  /** Server action de cierre de sesión; ausente en modo demo. */
  signOutAction?: () => Promise<void>
}) {
  const current = findModule(usePathname())
  const crumbs = current?.breadcrumb ?? [current?.label ?? 'Inicio']

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-white px-4">
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1 text-sm text-muted">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1 truncate">
            {i > 0 && <span aria-hidden className="text-line">›</span>}
            <span className={i === crumbs.length - 1 ? 'font-medium text-ink' : ''}>{c}</span>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <span className="mr-2 hidden text-sm text-muted sm:block">{organizationName}</span>
        {[
          { icon: MessageCircle, label: 'Mensajes', href: '/chat' },
          { icon: ClipboardList, label: 'Tareas (embudo)', href: '/embudo' },
          { icon: Bell, label: 'Pendientes de hoy', href: '/inicio' },
        ].map(({ icon: Icon, label, href }) => (
          <Link key={label} href={href} aria-label={label} title={label} className="relative rounded-lg border border-line p-1.5 text-muted hover:bg-surface hover:text-ink">
            <Icon className="h-4 w-4" aria-hidden />
          </Link>
        ))}
        <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{userInitials}</span>
        {signOutAction && (
          <Link href="/restablecer" aria-label="Cambiar contraseña" title="Cambiar contraseña" className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink">
            <KeyRound className="h-4 w-4" aria-hidden />
          </Link>
        )}
        {signOutAction && (
          <form action={signOutAction}>
            <button type="submit" aria-label="Cerrar sesión" title="Cerrar sesión" className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink">
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </form>
        )}
      </div>
    </header>
  )
}
