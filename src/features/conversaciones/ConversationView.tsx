import { Archive, ArchiveRestore, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Mascot } from '@/components/brand'
import { ActionForm, Avatar, SubmitButton } from '@/components/ui'
import { CHANNELS } from '@/config/sales'
import { cn } from '@/lib/cn'
import { formatDateTime, formatTime } from '@/lib/format'
import { setAiEnabled, setArchived } from './actions'
import { MarkRead } from './MarkRead'
import type { ConversationDetail, MessageRow } from './queries'
import { ReplyBox } from './ReplyBox'

function Bubble({ message }: { message: MessageRow }) {
  if (message.author === 'system') {
    return <p className="mx-auto max-w-[85%] rounded-full bg-surface px-3 py-1 text-center text-xs text-muted">{message.body}</p>
  }
  const mine = message.author !== 'client'
  return (
    <div className={cn('flex max-w-[85%] flex-col gap-1 md:max-w-[75%]', mine ? 'items-end self-end' : 'items-start self-start')}>
      <p className={cn('whitespace-pre-line break-words px-4 py-2.5',
        message.author === 'client' && 'rounded-[20px_20px_20px_6px] border border-line bg-white',
        message.author === 'human' && 'rounded-[20px_20px_6px_20px] bg-brand-600 text-white',
        message.author === 'ai' && 'rounded-[20px_20px_6px_20px] bg-accent-soft text-ink')}>
        {message.body}
      </p>
      <span className="flex items-center gap-1 text-xs text-muted">
        {message.author === 'ai' && <Mascot className="h-4 w-4" title="" />}
        {message.author === 'ai' ? 'Momo' : message.author === 'human' ? 'Equipo' : 'Cliente'} · {formatTime(message.sent_at)}
      </span>
    </div>
  )
}

export function ConversationView({ conversation, backHref, aiReady, editable }: {
  conversation: ConversationDetail
  backHref: string
  aiReady: boolean
  editable: boolean
}) {
  const channel = CHANNELS[conversation.channel]
  const archived = conversation.status === 'closed'
  const messages = [...conversation.messages].reverse()

  return (
    <section aria-label={`Conversación con ${conversation.contact.name}`} className="flex min-w-0 flex-col gap-4">
      {editable && <MarkRead id={conversation.id} unread={conversation.unread_count} />}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl border border-line bg-white p-3">
        <Link href={backHref} aria-label="Volver a la lista" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-brand-50 lg:hidden">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <Avatar name={conversation.contact.name} />
        <div className="min-w-0 flex-[1_1_180px]">
          <h2 className="truncate font-extrabold">{conversation.contact.name}</h2>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', channel.dot)} aria-hidden />
            <span className="truncate">{channel.label}{conversation.contact.comuna && <> · {conversation.contact.comuna}</>} · desde {formatDateTime(conversation.created_at)}</span>
          </p>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <form action={setAiEnabled}>
              <input type="hidden" name="conversation_id" value={conversation.id} />
              <input type="hidden" name="enabled" value={conversation.ai_enabled ? 'false' : 'true'} />
              <button type="submit" role="switch" aria-checked={conversation.ai_enabled}
                title={conversation.ai_enabled ? 'Cuando el canal esté conectado, Momo responderá solo' : 'La conversación queda en "Te esperan" hasta que respondas'}
                className={cn('inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-extrabold',
                  conversation.ai_enabled ? 'bg-accent-soft text-accent-strong' : 'bg-brand-50 text-brand-700')}>
                <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition', conversation.ai_enabled ? 'bg-accent-strong' : 'bg-brand-200')} aria-hidden>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition', conversation.ai_enabled ? 'left-[18px]' : 'left-0.5')} />
                </span>
                {conversation.ai_enabled ? 'Momo atiende' : 'Respondes tú'}
              </button>
            </form>
            <ActionForm action={setArchived}>
              <input type="hidden" name="conversation_id" value={conversation.id} />
              <input type="hidden" name="archived" value={archived ? 'false' : 'true'} />
              <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                {archived ? <><ArchiveRestore className="h-4 w-4" aria-hidden />Reabrir</> : <><Archive className="h-4 w-4" aria-hidden />Archivar</>}
              </SubmitButton>
            </ActionForm>
          </div>
        )}
      </header>

      <div className="flex max-h-[min(62vh,640px)] min-h-64 flex-col-reverse gap-3 overflow-y-auto rounded-3xl bg-surface p-4 ring-1 ring-line" tabIndex={0} aria-label="Mensajes">
        {messages.length === 0
          ? <p className="m-auto text-center text-sm text-muted">Aún no hay mensajes. Pega abajo lo que escribió el cliente.</p>
          : messages.map((m) => <Bubble key={m.id} message={m} />)}
      </div>

      {editable && !archived && (
        <ReplyBox conversationId={conversation.id} aiReady={aiReady} channelLabel={channel.label}
          waitingForReply={conversation.last_message_author === 'client'} />
      )}
      {archived && <p className="rounded-3xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">Conversación archivada. Reábrela para seguir respondiendo.</p>}
    </section>
  )
}
