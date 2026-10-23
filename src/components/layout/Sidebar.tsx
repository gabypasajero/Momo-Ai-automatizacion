'use client'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mascot } from '@/components/brand'
import { Avatar } from '@/components/ui'
import { NAV, activeSection } from '@/config/navigation'
import { cn } from '@/lib/cn'
import { NavIcon } from './NavIcon'
import { OrgSwitcher, type OrgOption } from './OrgSwitcher'

export interface ShellProps {
  orgId: string
  orgName: string
  orgs: OrgOption[]
  userName: string
  roleLabel: string
  waiting: number
  showAdmin: boolean
  switchOrg: (form: FormData) => Promise<void>
  signOut: () => Promise<void>
}

const linkClass = (active: boolean) => cn(
  'flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold transition',
  active ? 'bg-brand-600 font-bold text-white' : 'text-ink hover:bg-brand-50',
)

/** Menú lateral (computador): 5 secciones con nombre, ajustes y la persona abajo. */
export function Sidebar({ orgId, orgName, orgs, userName, roleLabel, waiting, showAdmin, switchOrg, signOut }: ShellProps) {
  const active = activeSection(usePathname())
  return (
    <nav aria-label="Menú principal" className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-white px-4 py-6 md:flex">
      <Link href="/hoy" className="mb-4 flex items-center gap-3 rounded-2xl px-2 py-1 hover:bg-brand-50">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100"><Mascot className="h-9 w-9" title="" /></span>
        <span className="min-w-0">
          <span className="block font-display text-lg font-bold leading-tight text-brand-700">Momo</span>
          <span className="block truncate text-xs text-muted">{orgName}</span>
        </span>
      </Link>
      {orgs.length > 1 && <OrgSwitcher current={orgId} orgs={orgs} action={switchOrg} className="mb-3" />}

      {NAV.map((item) => {
        const isActive = active === item.id
        return (
          <Link key={item.id} href={item.href} aria-current={isActive ? 'page' : undefined} className={linkClass(isActive)}>
            <NavIcon id={item.id} />
            {item.label}
            {item.id === 'conversaciones' && waiting > 0 && (
              <span className={cn('ml-auto min-w-6 rounded-full px-1.5 text-center text-xs font-extrabold', isActive ? 'bg-white text-brand-700' : 'bg-brand-100 text-brand-700')}
                aria-label={`${waiting} te esperan`}>{waiting}</span>
            )}
          </Link>
        )
      })}

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <Link href="/ajustes" aria-current={active === 'ajustes' ? 'page' : undefined} className={linkClass(active === 'ajustes')}>
          <NavIcon id="ajustes" />Ajustes
        </Link>
        {showAdmin && (
          <Link href="/admin" className={linkClass(false)}>
            <NavIcon id="admin" />Administración
          </Link>
        )}
        <div className="mt-2 flex items-center gap-3 rounded-2xl px-2 py-2">
          <Avatar name={userName} size="sm" className="bg-brand-600 text-white" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{userName}</p>
            <p className="text-xs text-muted">{roleLabel}</p>
          </div>
          <form action={signOut}>
            <button type="submit" aria-label="Cerrar sesión" title="Cerrar sesión" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-brand-50 hover:text-ink">
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
