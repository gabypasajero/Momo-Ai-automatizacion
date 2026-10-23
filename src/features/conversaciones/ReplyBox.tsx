'use client'

import { Check, ClipboardPaste, Pencil, Sparkles, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { ActionForm, SubmitButton, buttonClass, copyText } from '@/components/ui'
import { cn } from '@/lib/cn'
import { addMessage } from './actions'
import { suggestReplyAction } from './ai-actions'

type Mode = 'human' | 'client'

/**
 * Responder: Momo sugiere, tú decides. En canales sin conexión directa (Marketplace) la respuesta
 * se copia para pegarla en el chat del cliente y queda guardada en Momo.
 */
export function ReplyBox({ conversationId, aiReady, channelLabel, waitingForReply }: {
  conversationId: string
  aiReady: boolean
  channelLabel: string
  waitingForReply: boolean
}) {
  const [mode, setMode] = useState<Mode>('human')
  const [draft, setDraft] = useState('')
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [thinking, startThinking] = useTransition()

  const suggest = () => startThinking(async () => {
    setAiError(null)
    const result = await suggestReplyAction(conversationId)
    if (result.text) setSuggestion(result.text)
    else setAiError(result.error ?? 'Momo no pudo responder.')
  })

  const flashCopied = async (text: string) => {
    if (await copyText(text)) { setCopied(true); setTimeout(() => setCopied(false), 4000) }
  }

  return (
    <div className="space-y-3">
      {suggestion ? (
        <div className="rounded-3xl border-2 border-brand-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-brand-700"><Sparkles className="h-4 w-4" aria-hidden />Momo te sugiere responder</p>
          <p className="mt-2 whitespace-pre-line">{suggestion}</p>
          <ActionForm action={addMessage} onSuccess={() => setSuggestion(null)} className="mt-3">
            <input type="hidden" name="conversation_id" value={conversationId} />
            <input type="hidden" name="author" value="ai" />
            <input type="hidden" name="body" value={suggestion} />
            <div className="flex flex-wrap gap-2" onClickCapture={(e) => { if ((e.target as HTMLElement).closest('button[type=submit]')) void flashCopied(suggestion) }}>
              <SubmitButton pendingLabel="Guardando…"><ClipboardPaste className="h-4 w-4" aria-hidden />Copiar y guardar</SubmitButton>
              <button type="button" className={buttonClass('secondary')} onClick={() => { setDraft(suggestion); setMode('human'); setSuggestion(null) }}>
                <Pencil className="h-4 w-4" aria-hidden />Editar
              </button>
              <button type="button" className={buttonClass('ghost')} onClick={() => setSuggestion(null)}>
                <X className="h-4 w-4" aria-hidden />Descartar
              </button>
            </div>
          </ActionForm>
        </div>
      ) : aiReady ? (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-brand-50/60 p-3">
          <Sparkles className="h-5 w-5 text-brand-600" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold">{waitingForReply ? 'El cliente espera respuesta.' : 'Momo puede proponer el siguiente mensaje.'}</p>
          <button type="button" onClick={suggest} disabled={thinking} className={buttonClass('primary', 'sm')}>
            {thinking ? 'Momo está pensando…' : 'Sugerir respuesta'}
          </button>
        </div>
      ) : (
        <p className="rounded-3xl bg-accent-soft p-3 text-sm text-accent-strong">
          <strong>Sugerencias de Momo:</strong> se activan cuando el dueño agregue la clave de la IA (ver Ajustes › Plan). Mientras tanto, responde tú.
        </p>
      )}
      {aiError && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{aiError}</p>}

      <ActionForm action={addMessage} onSuccess={() => setDraft('')} className="rounded-3xl border border-line bg-white p-3">
        <input type="hidden" name="conversation_id" value={conversationId} />
        <input type="hidden" name="author" value={mode} />
        <div role="radiogroup" aria-label="¿Quién escribe?" className="mb-2 flex gap-1">
          {([['human', 'Tu respuesta'], ['client', 'Mensaje del cliente']] as const).map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)}
              className={cn('min-h-9 rounded-full px-3 text-sm font-bold', mode === id ? 'bg-brand-600 text-white' : 'text-muted hover:bg-brand-50')}>
              {label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor={`reply-${conversationId}`}>{mode === 'human' ? 'Tu respuesta' : 'Mensaje del cliente'}</label>
        <textarea id={`reply-${conversationId}`} name="body" value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={4000} required
          placeholder={mode === 'human' ? 'Escribe tu respuesta…' : `Pega aquí lo que escribió el cliente en ${channelLabel}`}
          className="w-full resize-y rounded-2xl bg-surface px-4 py-3 outline-none focus:ring-2 focus:ring-brand-100" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">
            {mode === 'human' ? `Se copia para pegarla en ${channelLabel} y queda guardada en Momo.` : 'Queda guardado en la conversación.'}
          </p>
          <div onClickCapture={(e) => { if (mode === 'human' && draft && (e.target as HTMLElement).closest('button[type=submit]')) void flashCopied(draft) }}>
            <SubmitButton pendingLabel="Guardando…">{mode === 'human' ? 'Copiar y guardar' : 'Agregar mensaje'}</SubmitButton>
          </div>
        </div>
      </ActionForm>
      {copied && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-2.5 text-sm font-bold text-success">
          <Check className="h-4 w-4" aria-hidden />Copiado. Pégalo en el chat de {channelLabel}.
        </p>
      )}
    </div>
  )
}
