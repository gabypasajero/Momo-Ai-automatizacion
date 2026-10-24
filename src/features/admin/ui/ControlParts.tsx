import { cn } from '@/lib/cn'

/** Piezas visuales de "Momo Control": fondo vino oscuro con detalles dorados. */
export function DarkPanel({ className, children, label }: { className?: string; children: React.ReactNode; label?: string }) {
  return (
    <section aria-label={label} className={cn('relative overflow-hidden rounded-[28px] bg-[#1E0F17] p-5 text-white md:p-6', className)}>
      <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[18px] border-[#F4B740]/15" aria-hidden />
      <div className="relative">{children}</div>
    </section>
  )
}

export function Stat({ label, value, hint, tone = 'light' }: { label: string; value: string; hint?: string; tone?: 'light' | 'dark' | 'gold' }) {
  return (
    <div className={cn('rounded-3xl p-4',
      tone === 'light' && 'border border-line bg-white',
      tone === 'dark' && 'bg-white/10 text-white',
      tone === 'gold' && 'bg-brand-600 text-white ring-1 ring-[#F4B740]/60')}>
      <p className={cn('text-sm font-bold', tone === 'light' ? 'text-muted' : 'opacity-80')}>{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      {hint && <p className={cn('text-xs', tone === 'light' ? 'text-muted' : 'opacity-75')}>{hint}</p>}
    </div>
  )
}

/** Barras horizontales simples (sin librerías). */
export function Bars({ items, format, dark }: { items: { label: string; value: number; note?: string }[]; format: (n: number) => string; dark?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-bold">{i.label}{i.note && <span className={cn('ml-1 font-normal', dark ? 'text-white/60' : 'text-muted')}>{i.note}</span>}</span>
            <span className="font-extrabold">{format(i.value)}</span>
          </div>
          <span className={cn('mt-1 block h-3 rounded-full', dark ? 'bg-white/10' : 'bg-brand-50')} aria-hidden>
            <span className={cn('block h-3 rounded-full', dark ? 'bg-brand-400' : 'bg-brand-600')} style={{ width: `${Math.max(2, (i.value / max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Columnas verticales (crecimiento por mes, costo por día). */
export function Columns({ items, label, dark }: { items: { label: string; value: number }[]; label: string; dark?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <figure aria-label={label}>
      <div className="flex h-36 items-end gap-2">
        {items.map((i, n) => (
          <div key={`${i.label}-${n}`} className="flex h-full flex-1 flex-col justify-end text-center">
            <span className="text-xs font-bold">{i.value || ''}</span>
            <span className={cn('mt-1 block rounded-t-xl', dark ? 'bg-brand-400' : 'bg-brand-600')} style={{ height: `${Math.max(3, (i.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        {items.map((i, n) => <span key={`${i.label}-${n}`} className={cn('flex-1 text-center text-xs', dark ? 'text-white/60' : 'text-muted')}>{i.label}</span>)}
      </div>
    </figure>
  )
}
