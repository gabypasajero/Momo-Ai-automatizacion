import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'success' | 'danger' | 'brand' | 'neutral'

const TONES: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  brand: 'bg-brand-100 text-brand-700',
  neutral: 'bg-surface text-muted',
}

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium', TONES[tone], className)}>{children}</span>
}
