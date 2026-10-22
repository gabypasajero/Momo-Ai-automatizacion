'use client'

import { KeyRound } from 'lucide-react'
import { useActionState } from 'react'
import { Button, PasswordInput } from '@/components/ui'
import { updatePassword, type NewPasswordState } from './actions'

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(updatePassword, { error: null })
  return (
    <form action={action} className="space-y-3">
      <PasswordInput name="password" label="Nueva contraseña (mínimo 8 caracteres)" autoComplete="new-password" />
      <PasswordInput name="confirm" label="Repite la contraseña" autoComplete="new-password" />
      {state.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="primary" disabled={pending} className="w-full py-2">
        <KeyRound className="h-4 w-4" /> {pending ? 'Guardando…' : 'Guardar y entrar'}
      </Button>
    </form>
  )
}
