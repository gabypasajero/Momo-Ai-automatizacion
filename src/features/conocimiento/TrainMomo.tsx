'use client'

import { BookOpenCheck, Check, ImagePlus, Pencil, RotateCcw, SendHorizontal, ThumbsUp, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Mascot } from '@/components/brand'
import { buttonClass, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { ProductPhoto } from '@/lib/ai/catalog'
import { rememberMomo, saveTrainingSession, teachMomo, trainMomo } from './actions'
import { ProductPhotos } from './ProductPhotos'

type Msg =
  | { id: number; author: 'client'; body: string; image?: string }
  | { id: number; author: 'ai'; body: string; question: string; status?: 'bien' | 'corregida'; photos?: ProductPhoto[] }
  | { id: number; author: 'note'; body: string; link?: boolean }

const STORE = 'momo_entrenamiento'
const SESSION = 'momo_entrenamiento_id'
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(16).padStart(12, '0')}-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`.replace(/^(.{8})(.{4})/, '$1-$2'))
let seq = Date.now()

/** Reduce la foto en el teléfono antes de enviarla (máx. 1280 px, JPEG): sube rápido y gasta menos. */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

/**
 * Entrenar a Momo: un chat de práctica igual al de un cliente. Enter envía.
 * Lo que Momo no sabe queda en "Dudas" y cada corrección se guarda como conocimiento.
 */
export function TrainMomo({ aiReady }: { aiReady: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [sessionId, setSessionId] = useState('')
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<number | null>(null)
  const [fix, setFix] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try { const saved = localStorage.getItem(STORE); if (saved) setMessages(JSON.parse(saved) as Msg[]) } catch {}
    let id = ''
    try { id = localStorage.getItem(SESSION) ?? '' } catch {}
    if (!/^[0-9a-f-]{36}$/i.test(id)) { id = newId(); try { localStorage.setItem(SESSION, id) } catch {} }
    setSessionId(id)
  }, [])

  // Cada conversación de entrenamiento queda registrada en el servidor (sin fotos).
  const log = (all: Msg[]) => {
    if (!sessionId) return
    void saveTrainingSession(sessionId, all.map((m) => ({ author: m.author, body: m.author === 'client' && m.image ? `${m.body} [foto]`.trim() : m.body })))
  }
  const restart = () => {
    const id = newId()
    try { localStorage.setItem(SESSION, id) } catch {}
    setSessionId(id); setMessages([]); setEditing(null)
  }
  useEffect(() => {
    const recent = messages.slice(-60)
    try { localStorage.setItem(STORE, JSON.stringify(recent)) } catch {
      // Si las fotos no caben en el navegador, se guarda la conversación sin ellas.
      try { localStorage.setItem(STORE, JSON.stringify(recent.map((m) => (m.author === 'client' && m.image ? { ...m, image: undefined, body: `${m.body} 📷`.trim() } : m)))) } catch {}
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, pending])

  if (!aiReady) {
    return <p className="rounded-2xl bg-accent-soft p-4 text-sm text-accent-strong">El entrenamiento se activa cuando se agregue la clave de la IA de Momo.</p>
  }

  const pickPhoto = async (file: File | undefined) => {
    setPhotoError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) { setPhotoError('Ese archivo no es una foto.'); return }
    try { setPhoto(await shrink(file)) } catch { setPhotoError('No se pudo leer la foto. Prueba con otra.') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const send = () => {
    const body = draft.trim()
    if ((!body && !photo) || pending) return
    const next: Msg[] = [...messages, { id: ++seq, author: 'client', body, image: photo ?? undefined }]
    setMessages(next); setDraft(''); setPhoto(null)
    start(async () => {
      // Solo las 3 fotos más recientes viajan completas; las anteriores van como aviso "envió una foto".
      const withPhoto = next.filter((m) => m.author === 'client' && m.image).slice(-3).map((m) => m.id)
      const transcript = next.filter((m) => m.author !== 'note').map((m) => ({
        author: m.author as 'client' | 'ai',
        body: m.body,
        image: m.author === 'client' && m.image ? (withPhoto.includes(m.id) ? m.image : 'foto') : undefined,
      }))
      let result: Awaited<ReturnType<typeof trainMomo>>
      try {
        result = await trainMomo(transcript)
      } catch {
        // Pasa si la página quedó abierta desde una versión anterior de la app.
        result = { error: 'No se pudo enviar. Recarga la página (o cierra y abre la app) e intenta otra vez.' }
      }
      const add: Msg[] = []
      for (const g of result.gaps ?? []) add.push({ id: ++seq, author: 'note', body: `Momo no sabía esto y lo anotó como duda: «${g}»`, link: true })
      add.push(result.text
        ? { id: ++seq, author: 'ai', body: result.text, question: body || 'el cliente envió una foto', photos: result.photos }
        : { id: ++seq, author: 'note', body: result.error ?? 'Momo no pudo responder.' })
      setMessages((m) => { const all = [...m, ...add]; log(all); return all })
      inputRef.current?.focus()
    })
  }

  const teach = (msg: Extract<Msg, { author: 'ai' }>) => {
    const answer = fix.trim()
    if (answer.length < 3) return
    start(async () => {
      const res = await teachMomo(msg.question, answer).catch(() => ({ error: 'No se pudo guardar. Recarga la página e intenta otra vez.' }))
      if (res.error) { setMessages((m) => [...m, { id: ++seq, author: 'note', body: res.error! }]); return }
      setMessages((m) => [
        ...m.map((x) => (x.id === msg.id ? { ...msg, body: answer, status: 'corregida' as const } : x)),
        { id: ++seq, author: 'note', body: 'Guardado en la memoria de Momo. Desde ahora responderá así.' },
      ])
      setEditing(null); setFix('')
    })
  }

  const mark = (msg: Extract<Msg, { author: 'ai' }>) => {
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...msg, status: 'bien' as const } : x)))
    void rememberMomo('aprobada', msg.question, msg.body).then((res) => {
      if (res.error) setMessages((m) => [...m, { id: ++seq, author: 'note', body: res.error! }])
    }).catch(() => {})
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
      <div className="flex items-center gap-3 border-b border-line bg-brand-50 px-4 py-3">
        <Mascot className="h-10 w-10" title="" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold">Entrenando a Momo</p>
          <p className="text-xs text-muted">Tú eres el cliente. Nada de esto se le envía a nadie.</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={restart} className={buttonClass('ghost', 'sm')}>
            <RotateCcw className="h-4 w-4" aria-hidden />Nueva
          </button>
        )}
      </div>

      <div className="flex max-h-[60vh] min-h-72 flex-col gap-3 overflow-y-auto bg-surface p-4" aria-live="polite" aria-label="Conversación de práctica">
        {messages.length === 0 && (
          <div className="m-auto max-w-sm text-center text-sm text-muted">
            <p className="font-bold text-ink">Escríbele como lo haría un cliente</p>
            <p className="mt-1">Por ejemplo: «Hola, ¿cuánto sale el clóset de 3 puertas con despacho a Maipú?». Presiona Enter para enviar. Con el botón de la foto puedes mandar una imagen, como lo haría un cliente que quiere su mueble personalizado.</p>
          </div>
        )}
        {messages.map((m) => m.author === 'note' ? (
          <p key={m.id} className="mx-auto max-w-[90%] rounded-2xl bg-warning-soft px-3 py-2 text-center text-xs font-semibold text-warning">
            {m.body}{m.link && <> · <Link href="/conocimiento?t=dudas" className="underline">Responder en Dudas</Link></>}
          </p>
        ) : m.author === 'client' ? (
          <div key={m.id} className="flex max-w-[85%] flex-col items-end gap-1 self-end">
            {/* eslint-disable-next-line @next/next/no-img-element -- foto local en base64, no pasa por el optimizador */}
            {m.image && <img src={m.image} alt="Foto enviada por el cliente" className="max-h-72 rounded-2xl border border-line object-contain" />}
            {m.body && <p className="whitespace-pre-line break-words rounded-[20px_20px_6px_20px] bg-brand-600 px-4 py-2.5 text-white">{m.body}</p>}
            <span className="text-xs text-muted">Tú (cliente)</span>
          </div>
        ) : (
          <div key={m.id} className="flex max-w-[85%] flex-col items-start gap-1 self-start">
            {editing === m.id ? (
              <div className="w-full min-w-[min(80vw,420px)] space-y-2 rounded-2xl border border-brand-200 bg-white p-3">
                <p className="text-xs font-bold text-muted">¿Cómo debió responder Momo?</p>
                <textarea value={fix} onChange={(e) => setFix(e.target.value)} rows={4} maxLength={2000} className={`${inputClass} resize-y`} autoFocus />
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setEditing(null)} className={buttonClass('ghost', 'sm')}>Cancelar</button>
                  <button type="button" disabled={pending} onClick={() => teach(m)} className={buttonClass('primary', 'sm')}>
                    <BookOpenCheck className="h-4 w-4" aria-hidden />Enseñar a Momo
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line break-words rounded-[20px_20px_20px_6px] border border-line bg-white px-4 py-2.5">{m.body}</p>
            )}
            {m.photos && <ProductPhotos photos={m.photos} />}
            <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <Mascot className="h-4 w-4" title="" />Momo
              {m.status === 'corregida' && <span className="font-bold text-success">· Corregida y guardada en la memoria</span>}
              {m.status === 'bien' && <span className="inline-flex items-center gap-1 font-bold text-success">· <Check className="h-3 w-3" aria-hidden />Guardada en la memoria</span>}
              {!m.status && editing !== m.id && <>
                <button type="button" onClick={() => mark(m)} className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 font-bold hover:bg-success-soft hover:text-success"><ThumbsUp className="h-3.5 w-3.5" aria-hidden />Bien</button>
                <button type="button" onClick={() => { setEditing(m.id); setFix(m.body) }} className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 font-bold hover:bg-brand-50 hover:text-brand-700"><Pencil className="h-3.5 w-3.5" aria-hidden />Corregir</button>
              </>}
            </span>
          </div>
        ))}
        {pending && editing === null && (
          <div className="flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm text-muted ring-1 ring-line">
            <Mascot className="h-5 w-5" title="" />Momo está escribiendo…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {(photo || photoError) && (
        <div className="flex items-center gap-3 border-t border-line bg-brand-50 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
          {photo && <img src={photo} alt="Foto lista para enviar" className="h-16 w-16 rounded-xl object-cover" />}
          <p className="flex-1 text-sm">{photoError ?? 'Foto lista. Escribe algo si quieres y presiona Enter.'}</p>
          <button type="button" onClick={() => { setPhoto(null); setPhotoError(null) }} aria-label="Quitar foto" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white"><X className="h-5 w-5" aria-hidden /></button>
        </div>
      )}
      <form className="flex items-end gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        <button type="button" onClick={() => fileRef.current?.click()} aria-label="Adjuntar foto" title="Adjuntar foto"
          className={cn(buttonClass('secondary'), 'h-12 w-12 shrink-0 px-0')}>
          <ImagePlus className="h-5 w-5" aria-hidden />
        </button>
        <label className="sr-only" htmlFor="entrenar-mensaje">Mensaje del cliente</label>
        <textarea id="entrenar-mensaje" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} maxLength={1000}
          enterKeyHint="send"
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.keyCode === 13) && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
          placeholder="Escribe como cliente y presiona Enter" className={cn(inputClass, 'max-h-40 min-h-12 flex-1 resize-none')} />
        <button type="submit" disabled={pending || (!draft.trim() && !photo)} aria-label="Enviar" className={cn(buttonClass('primary'), 'h-12 w-12 shrink-0 px-0')}>
          <SendHorizontal className="h-5 w-5" aria-hidden />
        </button>
      </form>
    </div>
  )
}
