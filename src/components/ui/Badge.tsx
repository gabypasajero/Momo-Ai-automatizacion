import type { ReactNode } from 'react'
import type { Tone } from '@/config/sales'
import { cn } from '@/lib/cn'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface text-muted ring-1 ring-line',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-soft text-success',
  accent: 'bg-accent-soft text-accent-strong',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold', TONES[tone], className)}>
      {children}
    </span>
  )
}
