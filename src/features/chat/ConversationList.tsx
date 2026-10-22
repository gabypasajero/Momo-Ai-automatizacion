'use client'

import { Avatar, Badge, Card, ChannelIcon, SearchInput } from '@/components/ui'
import type { Conversation } from '@/lib/data/types'
import { cn } from '@/lib/cn'

interface Props {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  query: string
  onQueryChange: (q: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect, query, onQueryChange }: Props) {
  return (
    <Card className="flex w-80 shrink-0 flex-col">
      <div className="border-b border-line p-3"><SearchInput value={query} onChange={onQueryChange} placeholder="Buscar" /></div>
      <ul className="scroll-thin flex-1 overflow-y-auto">
        {conversations.map((c) => {
          const last = c.messages.at(-1)
          return (
            <li key={c.id}>
              <button type="button" onClick={() => onSelect(c.id)} aria-current={selectedId === c.id}
                className={cn('flex w-full gap-3 border-b border-line p-3 text-left hover:bg-surface', selectedId === c.id && 'bg-brand-50')}>
                <Avatar name={c.contactName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-semibold">{c.contactName}</span>
                    {c.unread && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="No leído" />}
                    <span className="ml-auto text-[11px] text-muted">{c.lastMessageAt}</span>
                  </div>
                  <p className="truncate text-xs text-muted">{last?.text}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <ChannelIcon channel={c.channel} />
                    <Badge tone={c.aiEnabled ? 'success' : 'neutral'}>{c.aiEnabled ? 'IA activa' : 'IA pausada'}</Badge>
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
