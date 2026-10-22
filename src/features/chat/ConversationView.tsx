'use client'

import { MessageCircle, Pause, Play, Send } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Button, Card, ChannelIcon } from '@/components/ui'
import { CHANNELS } from '@/config/channels'
import type { Conversation, MessageAuthor } from '@/lib/data/types'
import { cn } from '@/lib/cn'

const BUBBLE: Record<MessageAuthor, string> = {
  client: 'bg-white border border-line',
  ai: 'bg-brand-600 text-white',
  human: 'bg-ink text-white',
}

interface Props {
  conversation: Conversation | undefined
  onSend: (text: string) => void
  onToggleAi: () => void
}

export function ConversationView({ conversation: c, onSend, onToggleAi }: Props) {
  const [draft, setDraft] = useState('')

  if (!c) {
    return (
      <Card className="flex min-w-0 flex-1 items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-brand-200" aria-hidden />
          <p className="mt-3 font-semibold text-brand-600">Selecciona un chat de la sección izquierda</p>
          <p className="text-sm text-muted">Elige una conversación de la lista para ver los mensajes aquí.</p>
        </div>
      </Card>
    )
  }

  const send = () => {
    if (!draft.trim()) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <Card className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-line p-3">
        <Avatar name={c.contactName} />
        <div>
          <p className="font-semibold">{c.contactName}</p>
          <p className="flex items-center gap-1 text-xs text-muted"><ChannelIcon channel={c.channel} /> {CHANNELS[c.channel].label}</p>
        </div>
        <Button onClick={onToggleAi} className="ml-auto">
          {c.aiEnabled ? <><Pause className="h-4 w-4" /> Pausar IA</> : <><Play className="h-4 w-4" /> Activar IA</>}
        </Button>
      </div>
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-surface p-4" aria-live="polite">
        {c.messages.map((m) => (
          <div key={m.id} className={cn('flex', m.author === 'client' ? 'justify-start' : 'justify-end')}>
            <div className={cn('max-w-md rounded-2xl px-4 py-2 text-sm', BUBBLE[m.author])}>
              {m.author !== 'client' && <p className="mb-0.5 text-[10px] uppercase opacity-75">{m.author === 'ai' ? '✦ Asistente IA' : 'Ejecutivo'}</p>}
              {m.text}
              <p className="mt-1 text-right text-[10px] opacity-60">{m.sentAt}</p>
            </div>
          </div>
        ))}
      </div>
      <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Mensaje"
          placeholder={c.aiEnabled ? 'La IA está respondiendo. Escribe para intervenir…' : 'Escribe un mensaje…'}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand-500" />
        <Button type="submit" variant="primary"><Send className="h-4 w-4" /> Enviar</Button>
      </form>
    </Card>
  )
}
