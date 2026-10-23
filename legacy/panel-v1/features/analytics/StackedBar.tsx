import { formatNumber } from '@/lib/format'

export interface StackedPart { label: string; value: number; className: string }

export function StackedBar({ title, parts }: { title: string; parts: StackedPart[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  const pct = (v: number) => (total ? Math.round((v / total) * 1000) / 10 : 0)
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold uppercase text-muted"><span>{title}</span><span>{formatNumber(total)}</span></div>
      <div className="mt-1.5 flex h-3 overflow-hidden rounded-full bg-surface" role="img" aria-label={parts.map((p) => `${p.label} ${pct(p.value)}%`).join(', ')}>
        {parts.map((p) => <div key={p.label} className={p.className} style={{ width: `${pct(p.value)}%` }} />)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-ink">
        {parts.map((p) => (
          <span key={p.label} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${p.className}`} />{p.label} {formatNumber(p.value)} ({pct(p.value)}%)
          </span>
        ))}
      </div>
    </div>
  )
}
