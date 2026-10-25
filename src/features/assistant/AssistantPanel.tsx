'use client'

import { ArrowRight, EyeOff, Send, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Mascot } from '@/components/brand'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'

type Action = { type: 'navigate'; href: string; label: string }
type Turn = { role: 'user' | 'assistant'; text: string; actions?: Action[] }

/** Preguntas sugeridas según quién usa la app. */
const SUGGESTIONS = {
  owner: ['¿Cómo vamos esta semana?', 'Dame 3 ideas para vender más', '¿Qué preguntan más los clientes?', '¿Qué clientes quedaron sin cerrar?'],
  agent: ['¿A quién tengo que responder?', '¿A quién le hago seguimiento hoy?', '¿Cómo vamos esta semana?', 'Busca clósets de 3 puertas'],
}

/** Atajos que funcionan aunque la IA no esté conectada todavía. */
const SHORTCUTS: Action[] = [
  { type: 'navigate', href: '/conversaciones?f=esperan', label: 'Te esperan' },
  { type: 'navigate', href: '/conocimiento', label: 'Lo que Momo sabe' },
  { type: 'navigate', href: '/conocimiento?t=dudas', label: 'Dudas por responder' },
  { type: 'navigate', href: '/ajustes?t=perfil#contrasena', label: 'Cambiar contraseña' },
]

function welcome(name: string, owner: boolean): Turn {
  return {
    role: 'assistant',
    text: owner
      ? `¡Hola ${name}! 👋 Soy Momo Equipo. Te cuento cómo va el negocio, qué clientes quedaron pendientes y te doy ideas para vender más. ¿Por dónde partimos?`
      : `¡Hola ${name}! 👋 Soy Momo Equipo. Te ayudo con tu día: a quién responder, a quién hacerle seguimiento y cómo cerrar esa venta difícil. ¿Qué necesitas?`,
  }
}

export function AssistantPanel({ onClose, onHideMascot, userName, owner }: { onClose: () => void; onHideMascot: () => void; userName: string; owner: boolean }) {
  const router = useRouter()
  const [turns, setTurns] = useState<Turn[]>(() => [welcome(userName, owner)])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [offline, setOffline] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [turns, thinking])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || thinking) return
    const next = [...turns, { role: 'user' as const, text: clean }]
    setTurns(next)
    setDraft('')
    setThinking(true)
    try {
      // Se envía solo el texto de la conversación (sin el saludo inicial), máximo 20 turnos.
      const history = next.slice(1).slice(-20).map(({ role, text }) => ({ role, text }))
      const res = await fetch('/api/asistente', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) })
      const data = await res.json().catch(() => ({}))
      const sinClave = data.error === 'sin-clave'
      if (sinClave) setOffline(true)
      setTurns((t) => [...t, {
        role: 'assistant',
        text: data.reply ?? 'No pude responder ahora. Intenta de nuevo.',
        actions: sinClave ? SHORTCUTS : data.actions,
      }])
    } catch {
      setTurns((t) => [...t, { role: 'assistant', text: 'Sin conexión. Revisa tu internet e intenta otra vez.' }])
    } finally {
      setThinking(false)
    }
  }

  const go = (href: string) => { router.push(href); onClose() } // misma pestaña, nunca ventanas nuevas

  return (
    <section role="dialog" aria-label="Asistente Momo"
      className="momo-pop fixed inset-x-2 bottom-[88px] z-50 flex h-[min(560px,calc(100vh-7rem))] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-pop md:inset-x-auto md:bottom-4 md:right-4 md:h-[min(560px,calc(100vh-2rem))] md:w-[380px]">
      <header className="flex items-center gap-2 border-b border-line bg-brand-50 px-4 py-3">
        <Mascot className="h-9 w-9" title="" />
        <div className="mr-auto">
          <h2 className="font-display font-bold">Momo Equipo</h2>
          <p className="text-xs text-muted">{offline ? 'Modo atajos (IA sin conectar)' : (owner ? 'Resultados, estrategia y pendientes' : 'Tu día de ventas y la app')}</p>
        </div>
        <button type="button" onClick={onHideMascot} title="Ocultar a Momo" aria-label="Ocultar a Momo" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"><EyeOff className="h-4 w-4" /></button>
        <button type="button" onClick={onClose} title="Cerrar" aria-label="Cerrar asistente" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"><X className="h-4 w-4" /></button>
      </header>

      <div ref={listRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-surface p-4" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className={cn('flex gap-2', t.role === 'user' ? 'justify-end' : 'justify-start')}>
            {t.role === 'assistant' && <Mascot className="mt-1 h-6 w-6" title="" />}
            <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm', t.role === 'user' ? 'bg-brand-600 text-white' : 'border border-line bg-white')}>
              <p className="whitespace-pre-line">{t.text}</p>
              {t.actions && t.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.actions.map((a) => (
                    <button key={a.href + a.label} type="button" onClick={() => go(a.href)}
                      className="inline-flex min-h-8 items-center gap-1 rounded-full bg-brand-100 px-3 text-xs font-bold text-brand-700 hover:bg-brand-200">
                      {a.label} <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Mascot className="h-6 w-6 animate-bounce" title="" /> Momo está pensando…
          </div>
        )}
        {turns.length === 1 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {SUGGESTIONS[owner ? 'owner' : 'agent'].map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className="min-h-8 rounded-full border border-brand-200 bg-white px-3 text-xs font-semibold text-brand-700 hover:bg-brand-50">{s}</button>
            ))}
          </div>
        )}
      </div>

      <form className="flex gap-2 border-t border-line p-2" onSubmit={(e) => { e.preventDefault(); send(draft) }}>
        <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} aria-label="Escribe a Momo"
          placeholder="Escríbele a Momo…" className="min-h-11 flex-1 rounded-full border border-line px-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
        <Button type="submit" variant="primary" disabled={thinking || !draft.trim()} aria-label="Enviar" className="w-11 px-0"><Send className="h-4 w-4" /></Button>
      </form>
    </section>
  )
}
