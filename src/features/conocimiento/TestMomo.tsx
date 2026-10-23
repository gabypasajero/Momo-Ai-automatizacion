'use client'

import { Sparkles } from 'lucide-react'
import { useState, useTransition } from 'react'
import { buttonClass, inputClass } from '@/components/ui'
import { testMomo } from './actions'

/** "Probar a Momo": escribe como si fueras un cliente y mira qué respondería. */
export function TestMomo({ aiReady }: { aiReady: boolean }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (!aiReady) {
    return (
      <p className="rounded-2xl bg-accent-soft p-4 text-sm text-accent-strong">
        La prueba se activa cuando se agregue la clave de la IA de Momo (Ajustes › Plan explica cómo). Las instrucciones que guardes aquí ya quedan listas.
      </p>
    )
  }

  return (
    <form className="space-y-3" onSubmit={(e) => {
      e.preventDefault()
      start(async () => {
        setError(null); setAnswer(null)
        const result = await testMomo(question)
        if (result.text) setAnswer(result.text)
        else setError(result.error ?? 'Momo no pudo responder.')
      })
    }}>
      <label className="block text-sm">
        <span className="font-bold">Pregunta de un cliente</span>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} maxLength={1000} required
          placeholder="Hola, ¿tienen closet de 3 puertas? ¿Cuánto sale el despacho a Rancagua?" className={`${inputClass} mt-1.5 resize-y`} />
      </label>
      <button type="submit" disabled={pending} className={buttonClass('primary')}>
        <Sparkles className="h-4 w-4" aria-hidden />{pending ? 'Momo está pensando…' : 'Probar respuesta'}
      </button>
      {answer && (
        <div role="status" className="rounded-2xl bg-accent-soft p-4">
          <p className="text-xs font-extrabold text-accent-strong">Momo respondería:</p>
          <p className="mt-1 whitespace-pre-line">{answer}</p>
        </div>
      )}
      {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{error}</p>}
    </form>
  )
}
