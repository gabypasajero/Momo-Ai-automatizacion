'use client'

import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PipelineStage } from '@/lib/data/types'
import { formatClp } from '@/lib/format'
import { cn } from '@/lib/cn'

interface Props {
  stage: PipelineStage
  count: number
  totalClp: number
  onDrop: () => void
  children: ReactNode
}

export function KanbanColumn({ stage, count, totalClp, onDrop, children }: Props) {
  return (
    <section aria-label={stage.name} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}
      className={cn('flex w-[min(20rem,calc(100vw-8rem))] shrink-0 flex-col rounded-2xl border border-t-4 border-line bg-surface', stage.tone)}>
      <header className="flex items-center justify-between px-3 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">{stage.emoji} {stage.name}</h2>
          <p className="text-xs text-muted">{formatClp(totalClp)} CLP · {count} tickets</p>
        </div>
        <Settings className="h-4 w-4 text-muted" aria-hidden />
      </header>
      <div className="scroll-thin flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {children}
        {count === 0 && <p className="py-6 text-center text-xs text-muted">Arrastra tickets aquí</p>}
      </div>
    </section>
  )
}
