'use client'

import { Building2, Gauge, Inbox, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const ITEMS = [
  { href: '/admin', label: 'Empresas', icon: Building2 },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: Inbox },
  { href: '/admin/consumo', label: 'Consumo de IA', icon: Gauge },
  { href: '/admin/seguridad', label: 'Seguridad', icon: ShieldCheck },
]

export function AdminNav({ pending }: { pending: number }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Administración" className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' || pathname.startsWith('/admin/empresas') : pathname.startsWith(href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={cn('flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 font-semibold transition',
              active ? 'bg-white text-ink' : 'text-white/80 hover:bg-white/10 hover:text-white')}>
            <Icon className="h-5 w-5" aria-hidden />{label}
            {href === '/admin/solicitudes' && pending > 0 && (
              <span className={cn('ml-auto min-w-6 rounded-full px-1.5 text-center text-xs font-extrabold', active ? 'bg-brand-600 text-white' : 'bg-brand-400 text-white')}>{pending}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
