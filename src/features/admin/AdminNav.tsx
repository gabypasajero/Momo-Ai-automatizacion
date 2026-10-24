'use client'

import { Building2, Ellipsis, Gauge, Home, Inbox, ShieldCheck, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const ITEMS = [
  { href: '/admin', label: 'Inicio', icon: Home },
  { href: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { href: '/admin/ganancias', label: 'Ganancias', icon: Wallet },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: Inbox },
  { href: '/admin/consumo', label: 'Consumo de IA', icon: Gauge },
  { href: '/admin/seguridad', label: 'Seguridad', icon: ShieldCheck },
]
const PHONE = ['/admin', '/admin/empresas', '/admin/ganancias', '/admin/solicitudes']

const isActive = (pathname: string, href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

function Count({ n, strong }: { n: number; strong?: boolean }) {
  if (n <= 0) return null
  return <span className={cn('min-w-6 rounded-full px-1.5 text-center text-xs font-extrabold', strong ? 'bg-white text-brand-700' : 'bg-[#F4B740] text-[#2A1420]')}>{n}</span>
}

/** Menú lateral de Momo Control (computador). */
export function AdminNav({ pending }: { pending: number }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Administración" className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={cn('flex min-h-11 items-center gap-3 rounded-2xl px-3 font-semibold transition',
              active ? 'bg-brand-600 text-white shadow-[inset_0_0_0_1px_#F4B740]' : 'text-white/80 hover:bg-white/10 hover:text-white')}>
            <Icon className="h-5 w-5" aria-hidden /><span className="flex-1">{label}</span>
            {href === '/admin/solicitudes' && <Count n={pending} strong={active} />}
          </Link>
        )
      })}
    </nav>
  )
}

/** Barra inferior de Momo Control en el teléfono: oscura con dorado, distinta a la de las empresas. */
export function AdminBottomNav({ pending }: { pending: number }) {
  const pathname = usePathname()
  const inPhone = PHONE.some((h) => isActive(pathname, h))
  const items = [...ITEMS.filter((i) => PHONE.includes(i.href)), { href: '/admin/mas', label: 'Más', icon: Ellipsis }]
  return (
    <nav aria-label="Administración" className="fixed inset-x-3 bottom-[max(10px,env(safe-area-inset-bottom))] z-30 grid grid-cols-5 gap-1 rounded-[26px] border border-[#F4B740]/25 bg-[#1E0F17] p-1.5 shadow-xl shadow-black/30 md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin/mas' ? !inPhone : isActive(pathname, href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={cn('relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[20px] text-[11px] font-bold',
              active ? 'bg-brand-600 text-white shadow-[inset_0_0_0_1px_#F4B740]' : 'text-white/80')}>
            <Icon className="h-6 w-6" aria-hidden />{label}
            {href === '/admin/solicitudes' && pending > 0 && <span className="absolute right-1.5 top-1"><Count n={pending} strong={active} /></span>}
          </Link>
        )
      })}
    </nav>
  )
}
