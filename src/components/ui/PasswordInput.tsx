'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

/** Campo de contraseña con botón para mostrarla (evita errores al escribir en el celular). */
export function PasswordInput({ name, label, autoComplete, minLength }: { name: string; label: string; autoComplete: string; minLength?: number }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="block text-sm">
      <span className="font-bold">{label}</span>
      <span className={cn('mt-1.5 flex items-center rounded-2xl border border-line bg-white transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100')}>
        <input name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required minLength={minLength}
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className="w-full rounded-2xl bg-transparent px-4 py-2.5 text-[15px] outline-none" />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-ink">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  )
}
