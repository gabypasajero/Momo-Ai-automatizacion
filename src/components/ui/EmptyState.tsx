import type { ReactNode } from 'react'
import { Mascot } from '@/components/brand'
import { cn } from '@/lib/cn'

export function EmptyState({ title, description, action, className }: {
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-3xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center', className)}>
      <Mascot className="h-14 w-14" title="" />
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
