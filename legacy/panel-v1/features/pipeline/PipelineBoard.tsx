'use client'

import { useMemo, useState } from 'react'
import type { ChannelType, Pipeline, Ticket } from '@/lib/data/types'
import { KanbanColumn } from './KanbanColumn'
import { PipelineToolbar, type StatusFilter, type ViewMode } from './PipelineToolbar'
import { TicketCard } from './TicketCard'
import { TicketTable } from './TicketTable'

export function PipelineBoard({ pipeline, initialTickets }: { pipeline: Pipeline; initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets)
  const [query, setQuery] = useState('')
  const [channels, setChannels] = useState<ChannelType[]>([])
  const [status, setStatus] = useState<StatusFilter>('open')
  const [mode, setMode] = useState<ViewMode>('kanban')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const visible = useMemo(() => tickets.filter((t) =>
    (status === 'all' || (status === 'open' ? t.status === 'open' : t.status !== 'open')) &&
    (channels.length === 0 || channels.includes(t.channel)) &&
    t.contactName.toLowerCase().includes(query.toLowerCase()),
  ), [tickets, status, channels, query])

  // TODO(backend): persistir cambios de etapa/estado vía server action.
  const update = (id: string, patch: Partial<Ticket>) =>
    setTickets((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const toggleChannel = (c: ChannelType) =>
    setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))

  return (
    <div className="flex h-full min-w-0 flex-col gap-3">
      <PipelineToolbar
        pipelineName={pipeline.name} mode={mode} onModeChange={setMode}
        channels={channels} onToggleChannel={toggleChannel}
        query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus}
      />
      {mode === 'list' ? (
        <TicketTable tickets={visible} stages={pipeline.stages} />
      ) : (
        <div className="scroll-thin flex min-w-0 flex-1 gap-3 overflow-x-auto pb-2">
          {pipeline.stages.map((stage) => {
            const items = visible.filter((t) => t.stageId === stage.id)
            return (
              <KanbanColumn key={stage.id} stage={stage} count={items.length}
                totalClp={items.reduce((sum, t) => sum + t.valueClp, 0)}
                onDrop={() => { if (draggingId) update(draggingId, { stageId: stage.id }); setDraggingId(null) }}>
                {items.map((t) => (
                  <TicketCard key={t.id} ticket={t} stages={pipeline.stages}
                    onDragStart={() => setDraggingId(t.id)}
                    onMove={(stageId) => update(t.id, { stageId })}
                    onClose={(s) => update(t.id, { status: s })} />
                ))}
              </KanbanColumn>
            )
          })}
        </div>
      )}
    </div>
  )
}
