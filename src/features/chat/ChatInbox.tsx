'use client'

import { useState } from 'react'
import type { ChannelType, Conversation } from '@/lib/data/types'
import { nowTime } from '@/lib/format'
import { ChatFilters } from './ChatFilters'
import { ConversationList } from './ConversationList'
import { ConversationView } from './ConversationView'

export function ChatInbox({ initialConversations, initialSelectedId = null }: {
  initialConversations: Conversation[]
  /** Conversación a abrir directamente (enlaces de la extensión: /chat?c=<id>). */
  initialSelectedId?: string | null
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations.some((c) => c.id === initialSelectedId) ? initialSelectedId : null,
  )
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState<ChannelType | null>(null)

  const visible = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(query.toLowerCase()) && (!channel || c.channel === channel))

  // TODO(backend): enviar por la API del canal y suscribirse a Supabase Realtime.
  const patchSelected = (fn: (c: Conversation) => Conversation) =>
    setConversations((cs) => cs.map((c) => (c.id === selectedId ? fn(c) : c)))

  const send = (text: string) => patchSelected((c) => {
    const sentAt = nowTime()
    return { ...c, lastMessageAt: sentAt, messages: [...c.messages, { id: crypto.randomUUID(), author: 'human', text, sentAt }] }
  })

  const select = (id: string) => {
    setSelectedId(id)
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, unread: false } : c)))
  }

  return (
    <div className="flex h-full min-w-0 gap-3">
      <ChatFilters channel={channel} onChannelChange={setChannel} />
      <ConversationList conversations={visible} selectedId={selectedId} onSelect={select} query={query} onQueryChange={setQuery}
        className={selectedId ? 'hidden md:flex' : 'flex'} />
      <ConversationView
        conversation={conversations.find((c) => c.id === selectedId)}
        className={selectedId ? 'flex' : 'hidden md:flex'}
        onBack={() => setSelectedId(null)}
        onSend={send}
        onToggleAi={() => patchSelected((c) => ({ ...c, aiEnabled: !c.aiEnabled }))}
      />
    </div>
  )
}
