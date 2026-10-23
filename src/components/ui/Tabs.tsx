import Link from 'next/link'
import { cn } from '@/lib/cn'

export interface TabItem {
  id: string
  label: string
  href: string
  count?: number
}

/** Pestañas como enlaces (la pestaña activa vive en la URL: se puede compartir y volver atrás). */
export function Tabs({ items, active, label }: { items: TabItem[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="flex gap-2 overflow-x-auto pb-1">
      {items.map((t) => {
        const current = t.id === active
        return (
          <Link key={t.id} href={t.href} aria-current={current ? 'page' : undefined} scroll={false}
            className={cn('inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition',
              current ? 'bg-brand-600 text-white' : 'border border-line bg-white text-ink hover:border-brand-200')}>
            {t.label}
            {t.count !== undefined && <span className={cn('rounded-full px-1.5 text-xs', current ? 'bg-white/20' : 'bg-brand-50 text-brand-700')}>{t.count}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
