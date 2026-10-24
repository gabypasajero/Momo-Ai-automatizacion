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

/** Menú inferior del teléfono: barra flotante color vino con 4 botones grandes al alcance del pulgar. */
export function BottomNav({ waiting }: { waiting: number }) {
  const section = activeSection(usePathname())
  // Lo que no está en la barra (conocimiento, resultados, ajustes) se marca en "Más".
  const active = section && ITEMS.some((i) => i.id === section) ? section : section ? 'mas' : null
  return (
    <nav aria-label="Menú principal" className="fixed inset-x-3 bottom-[max(10px,env(safe-area-inset-bottom))] z-30 grid grid-cols-4 gap-1 rounded-[28px] bg-brand-900 p-1.5 shadow-xl shadow-brand-900/30 md:hidden">
      {ITEMS.map((item) => {
        const isActive = active === item.id
        return (
          <Link key={item.id} href={item.href} aria-current={isActive ? 'page' : undefined}
            className={cn('relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-[22px] text-[13px] transition', isActive ? 'bg-brand-50 font-extrabold text-brand-700' : 'font-bold text-white/85')}>
            <NavIcon id={item.id} className="h-7 w-7" />
            {item.label}
            {item.id === 'conversaciones' && waiting > 0 && (
              <span className="absolute right-[18%] top-1 min-w-6 rounded-full bg-[#F4B740] px-1 text-center text-xs text-brand-900 ring-2 ring-brand-900 font-extrabold" aria-label={`${waiting} te esperan`}>{waiting}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
