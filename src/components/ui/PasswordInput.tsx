'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

/** Campo de contraseña con botón para mostrarla (evita errores al escribir en el celular). */
export function PasswordInput({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <span className="mt-1 flex items-center rounded-lg border border-line focus-within:border-brand-500">
        <input name={name} type={visible ? 'text' : 'password'} autoComplete={autoComplete} required
          autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className="w-full rounded-lg px-3 py-2 outline-none" />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="px-3 text-muted hover:text-ink">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  )
}
