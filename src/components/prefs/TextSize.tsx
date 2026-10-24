'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

/** Botón "Letra grande": agranda todo el texto de la app y lo recuerda en este teléfono. */
export function TextSize({ initial }: { initial: boolean }) {
  const [big, setBig] = useState(initial)
  const toggle = () => {
    const next = !big
    setBig(next)
    document.documentElement.classList.toggle('letra-grande', next)
    document.cookie = `momo_letra=${next ? 'grande' : 'normal'}; path=/; max-age=31536000; samesite=lax`
  }
  return (
    <button type="button" role="switch" aria-checked={big} onClick={toggle}
      className="flex min-h-16 w-full items-center gap-4 rounded-3xl border border-line bg-white p-4 text-left hover:border-brand-200">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 font-display text-xl font-bold text-brand-700" aria-hidden>Aa</span>
      <span className="min-w-0 flex-1"><span className="block font-extrabold">Letra grande</span><span className="block text-sm text-muted">Para leer más cómodo</span></span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition', big ? 'bg-brand-600' : 'bg-brand-200')} aria-hidden>
        <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white transition', big ? 'left-6' : 'left-1')} />
      </span>
    </button>
  )
}
