'use client'

import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { buttonClass } from '@/components/ui'
import { analyzeWeek } from './actions'

/** Botón "Analizar mi semana": genera un nuevo resumen de aprendizaje. */
export function AnalyzeWeek({ hasReport, aiReady }: { hasReport: boolean; aiReady: boolean }) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  if (!aiReady) return <p className="text-sm text-muted">El análisis se activa cuando se agregue la clave de la IA de Momo.</p>
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={pending} className={buttonClass('primary')} onClick={() => start(async () => {
        setMessage(null)
        const res = await analyzeWeek().catch(() => ({ error: 'No se pudo analizar. Recarga la página e intenta otra vez.' }))
        if (res.error) setMessage(res.error)
        else if ('empty' in res && res.empty) setMessage('Esta semana no hubo conversaciones ni entrenamientos para analizar.')
        else router.refresh()
      })}>
        <Sparkles className="h-4 w-4" aria-hidden />{pending ? 'Momo está revisando tu semana…' : hasReport ? 'Analizar de nuevo' : 'Analizar mi semana'}
      </button>
      {message && <p role="status" className="text-sm font-semibold text-brand-700">{message}</p>}
    </div>
  )
}
