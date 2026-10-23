'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { activeSection, type NavId } from '@/config/navigation'
import { cn } from '@/lib/cn'
import { NavIcon } from './NavIcon'

const ITEMS: { id: NavId; label: string; href: string }[] = [
  { id: 'hoy', label: 'Hoy', href: '/hoy' },
  { id: 'conversaciones', label: 'Chats', href: '/conversaciones' },
  { id: 'clientes', label: 'Clientes', href: '/clientes' },
  { id: 'mas', label: 'Más', href: '/mas' },
]

/** Menú inferior del celular: 4 botones grandes al alcance del pulgar. */
export function BottomNav({ waiting }: { waiting: number }) {
  const section = activeSection(usePathname())
  // Lo que no está en la barra (conocimiento, resultados, ajustes) se marca en "Más".
  const active = section && ITEMS.some((i) => i.id === section) ? section : section ? 'mas' : null
  return (
    <nav aria-label="Menú principal" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white/95 px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur md:hidden">
      {ITEMS.map((item) => {
        const isActive = active === item.id
        return (
          <Link key={item.id} href={item.href} aria-current={isActive ? 'page' : undefined}
            className={cn('relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs', isActive ? 'font-extrabold text-brand-600' : 'font-bold text-muted')}>
            <NavIcon id={item.id} className="h-6 w-6" />
            {item.label}
            {item.id === 'conversaciones' && waiting > 0 && (
              <span className="absolute right-[22%] top-0.5 min-w-5 rounded-full bg-brand-600 px-1 text-center text-[11px] font-extrabold text-white" aria-label={`${waiting} te esperan`}>{waiting}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
