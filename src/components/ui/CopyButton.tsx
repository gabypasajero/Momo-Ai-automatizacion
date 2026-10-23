'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { buttonClass, type ButtonSize, type ButtonVariant } from './Button'

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

export function CopyButton({ value, label = 'Copiar', variant = 'secondary', size = 'sm' }: { value: string; label?: string; variant?: ButtonVariant; size?: ButtonSize }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className={buttonClass(variant, size)}
      onClick={async () => { if (await copyText(value)) { setDone(true); setTimeout(() => setDone(false), 1800) } }}>
      {done ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{done ? 'Copiado' : label}</span>
    </button>
  )
}
