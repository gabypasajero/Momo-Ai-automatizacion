'use client'

import { ChevronDown, Columns3, List } from 'lucide-react'
import { Card, ChannelIcon, SearchInput } from '@/components/ui'
import type { ChannelType } from '@/lib/data/types'
import { cn } from '@/lib/cn'

export type ViewMode = 'kanban' | 'list'
export type StatusFilter = 'open' | 'all' | 'closed'

const FILTER_CHANNELS: ChannelType[] = ['messenger', 'whatsapp', 'instagram']
const STATUS_OPTIONS: [StatusFilter, string][] = [['open', 'Abiertos'], ['all', 'Todos'], ['closed', 'Cerrados']]

interface Props {
  pipelineName: string
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
  channels: ChannelType[]
  onToggleChannel: (channel: ChannelType) => void
  query: string
  onQueryChange: (query: string) => void
  status: StatusFilter
  onStatusChange: (status: StatusFilter) => void
}

export function PipelineToolbar(p: Props) {
  return (
    <Card className="flex flex-wrap items-center gap-2 p-2">
      <button type="button" className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
        {p.pipelineName} <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
      <div role="group" aria-label="Vista" className="flex rounded-lg border border-line p-0.5">
        {([['kanban', Columns3, 'Kanban'], ['list', List, 'Lista']] as const).map(([m, Icon, label]) => (
          <button key={m} type="button" aria-label={label} aria-pressed={p.mode === m} onClick={() => p.onModeChange(m)}
            className={cn('rounded-md p-1.5', p.mode === m ? 'bg-brand-100 text-brand-700' : 'text-muted')}>
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        ))}
      </div>
      <div role="group" aria-label="Filtrar por canal" className="flex items-center gap-1 rounded-lg border border-line px-2 py-1">
        {FILTER_CHANNELS.map((c) => (
          <button key={c} type="button" aria-pressed={p.channels.includes(c)} onClick={() => p.onToggleChannel(c)}
            className={cn('rounded-md transition', p.channels.length > 0 && !p.channels.includes(c) && 'opacity-30')}>
            <ChannelIcon channel={c} />
          </button>
        ))}
      </div>
      <SearchInput value={p.query} onChange={p.onQueryChange} placeholder="Buscar contacto" className="w-56" />
      <div role="group" aria-label="Estado" className="ml-auto flex rounded-lg border border-line p-0.5 text-sm">
        {STATUS_OPTIONS.map(([s, label]) => (
          <button key={s} type="button" aria-pressed={p.status === s} onClick={() => p.onStatusChange(s)}
            className={cn('rounded-md px-3 py-1', p.status === s ? 'bg-brand-600 text-white' : 'text-muted')}>
            {label}
          </button>
        ))}
      </div>
    </Card>
  )
}
