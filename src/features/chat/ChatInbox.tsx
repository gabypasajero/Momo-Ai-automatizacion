'use client'

import { useState } from 'react'
import type { ChannelType, Conversation } from '@/lib/data/types'
import { nowTime } from '@/lib/format'
import { ChatFilters } from './ChatFilters'
import { ConversationList } from './ConversationList'
import { ConversationView } from './ConversationView'

export function ChatInbox({ initialConversations }: { initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
    <div className="flex h-full gap-3">
      <ChatFilters channel={channel} onChannelChange={setChannel} />
      <ConversationList conversations={visible} selectedId={selectedId} onSelect={select} query={query} onQueryChange={setQuery} />
      <ConversationView
        conversation={conversations.find((c) => c.id === selectedId)}
        onSend={send}
        onToggleAi={() => patchSelected((c) => ({ ...c, aiEnabled: !c.aiEnabled }))}
      />
    </div>
  )
}
