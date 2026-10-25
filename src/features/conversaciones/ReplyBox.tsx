'use client'

import { BookOpenCheck, Check, ClipboardPaste, Pencil, Sparkles, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { ActionForm, SubmitButton, buttonClass, copyText } from '@/components/ui'
import { cn } from '@/lib/cn'
import { addMessage } from './actions'
import { ProductPhotos } from '@/features/conocimiento/ProductPhotos'
import type { ProductPhoto } from '@/lib/ai/catalog'
import { DesignPreview } from '@/features/disenador/DesignPreview'
import type { DesignSpec } from '@/features/disenador/modelos'
import { learnFromEdit, suggestReplyAction } from './ai-actions'

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
  const [photos, setPhotos] = useState<ProductPhoto[]>([])
  const [designs, setDesigns] = useState<DesignSpec[]>([])
  // Sugerencia que se pasó a "Editar": si se guarda distinta, Momo ofrece aprender la versión corregida.
  const [editedFrom, setEditedFrom] = useState<string | null>(null)
  const [teach, setTeach] = useState<{ answer: string; state: 'ask' | 'saving' | 'done' | 'error'; message?: string } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [thinking, startThinking] = useTransition()

  const suggest = () => startThinking(async () => {
    setAiError(null)
    const result = await suggestReplyAction(conversationId)
    if (result.text) { setSuggestion(result.text); setPhotos(result.photos ?? []); setDesigns(result.designs ?? []) }
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
          {photos.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-bold text-muted">Fotos para enviarle (mantén apretada una foto para guardarla, o abre la página del producto):</p>
              <ProductPhotos photos={photos} />
            </div>
          )}
          {designs.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-bold text-muted">Vista previa del diseño (descárgala y envíasela al cliente):</p>
              <div className="flex flex-wrap gap-2">{designs.map((d, i) => <DesignPreview key={i} spec={d} photo={null} />)}</div>
            </div>
          )}
          <ActionForm action={addMessage} onSuccess={() => setSuggestion(null)} className="mt-3">
            <input type="hidden" name="conversation_id" value={conversationId} />
            <input type="hidden" name="author" value="ai" />
            <input type="hidden" name="body" value={suggestion} />
            <input type="hidden" name="from_suggestion" value="true" />
            <div className="flex flex-wrap gap-2" onClickCapture={(e) => { if ((e.target as HTMLElement).closest('button[type=submit]')) void flashCopied(suggestion) }}>
              <SubmitButton pendingLabel="Guardando…"><ClipboardPaste className="h-4 w-4" aria-hidden />Copiar y guardar</SubmitButton>
              <button type="button" className={buttonClass('secondary')} onClick={() => { setDraft(suggestion); setEditedFrom(suggestion); setMode('human'); setSuggestion(null); setTeach(null) }}>
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

      {teach && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-brand-200 bg-brand-50 p-4">
          <BookOpenCheck className="h-6 w-6 shrink-0 text-brand-700" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-semibold">
            {teach.state === 'done' ? '¡Listo! Momo responderá así la próxima vez.' : teach.state === 'error' ? teach.message : 'Cambiaste la respuesta de Momo. ¿Quieres que responda así la próxima vez?'}
          </p>
          {(teach.state === 'ask' || teach.state === 'saving') && <>
            <button type="button" disabled={teach.state === 'saving'} className={buttonClass('primary', 'sm')} onClick={async () => {
              setTeach({ ...teach, state: 'saving' })
              const res = await learnFromEdit(conversationId, teach.answer).catch(() => ({ error: 'No se pudo guardar. Recarga e intenta otra vez.' }))
              setTeach(res.error ? { ...teach, state: 'error', message: res.error } : { ...teach, state: 'done' })
            }}>{teach.state === 'saving' ? 'Guardando…' : 'Sí, enseñarle'}</button>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setTeach(null)}>No</button>
          </>}
          {(teach.state === 'done' || teach.state === 'error') && <button type="button" aria-label="Cerrar" className={buttonClass('ghost', 'sm')} onClick={() => setTeach(null)}><X className="h-4 w-4" aria-hidden /></button>}
        </div>
      )}

      <ActionForm action={addMessage} onSuccess={() => {
        if (mode === 'human' && editedFrom && draft.trim() && draft.trim() !== editedFrom.trim()) setTeach({ answer: draft.trim(), state: 'ask' })
        setEditedFrom(null)
        setDraft('')
      }} className="rounded-3xl border border-line bg-white p-3">
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
