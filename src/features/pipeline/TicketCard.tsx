'use client'

import { Check, X } from 'lucide-react'
import { Badge, ChannelIcon } from '@/components/ui'
import type { PipelineStage, Ticket } from '@/lib/data/types'
import { formatClp } from '@/lib/format'

interface Props {
  ticket: Ticket
  stages: PipelineStage[]
  onMove: (stageId: string) => void
  onClose: (status: 'won' | 'lost') => void
  onDragStart: () => void
}

export function TicketCard({ ticket: t, stages, onMove, onClose, onDragStart }: Props) {
  return (
    <article draggable onDragStart={onDragStart}
      className="cursor-grab rounded-xl border border-line bg-white p-3 shadow-sm active:cursor-grabbing">
      <div className="flex items-center gap-2">
        <ChannelIcon channel={t.channel} />
        <h3 className="truncate text-sm font-semibold">{t.contactName}</h3>
        <Badge tone={t.aiHandled ? 'success' : 'danger'} className="ml-auto">{t.aiHandled ? 'Atendido por IA' : 'No atendido'}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted">{t.lastMessage}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{t.lastMessageAt} · Hoy</span>
        {t.status !== 'open' && (
          <span className={t.status === 'won' ? 'text-success' : 'text-danger'}>{t.status === 'won' ? 'Ganado' : 'Perdido'}</span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
        <span className="whitespace-nowrap text-sm font-semibold">{formatClp(t.valueClp)}</span>
        <div className="flex items-center gap-1">
          <button type="button" title="Marcar venta ganada" aria-label="Marcar venta ganada" onClick={() => onClose('won')} className="rounded p-1 text-success hover:bg-success-soft"><Check className="h-4 w-4" /></button>
          <button type="button" title="Marcar como perdido" aria-label="Marcar como perdido" onClick={() => onClose('lost')} className="rounded p-1 text-danger hover:bg-danger-soft"><X className="h-4 w-4" /></button>
          <select aria-label="Mover a etapa" value={t.stageId} onChange={(e) => onMove(e.target.value)} className="max-w-[110px] rounded border border-line text-[11px]">
            {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
    </article>
  )
}
