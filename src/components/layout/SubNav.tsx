'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { findModule } from '@/config/navigation'
import { cn } from '@/lib/cn'

export function SubNav() {
  const pathname = usePathname()
  const current = findModule(pathname)
  if (!current?.submenu) return null

  return (
    <aside aria-label={`Submenú de ${current.label}`} className="hidden w-56 shrink-0 border-r border-line bg-white p-3 md:block">
      <p className="px-2 text-xs font-bold uppercase tracking-wide text-ink">{current.label}</p>
      {current.submenu.map(({ group, items }) => (
        <div key={group || 'main'} className="mt-4">
          {group && <p className="px-2 text-[11px] font-semibold uppercase text-muted">{group}</p>}
          {items.map((item) => {
            const Icon = item.icon
            const className = 'mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm'
            if (item.ready === false) {
              return (
                <span key={item.label} aria-disabled className={cn(className, 'cursor-not-allowed text-muted')}>
                  <Icon className="h-4 w-4" aria-hidden />{item.label}
                  <span className="ml-auto rounded bg-surface px-1.5 text-[10px]">Pronto</span>
                </span>
              )
            }
            const active = pathname === item.href
            return (
              <Link key={item.label} href={item.href} aria-current={active ? 'page' : undefined}
                className={cn(className, active ? 'bg-brand-100 font-medium text-brand-700' : 'text-ink hover:bg-surface')}>
                <Icon className="h-4 w-4" aria-hidden />{item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </aside>
  )
}

/** Celular: pestañas horizontales del submenú bajo la barra superior. */
export function SubNavTabs() {
  const pathname = usePathname()
  const current = findModule(pathname)
  if (!current?.submenu) return null
  const links = current.submenu.flatMap((g) => g.items).filter((i) => i.ready !== false)

  return (
    <nav aria-label={`Secciones de ${current.label}`} className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 md:hidden">
        {links.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link key={item.label} href={item.href} aria-current={active ? 'page' : undefined}
              className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm', active ? 'bg-brand-100 font-medium text-brand-700' : 'border border-line text-ink')}>
              <Icon className="h-4 w-4" aria-hidden />{item.label}
            </Link>
          )
        })}
    </nav>
  )
}
