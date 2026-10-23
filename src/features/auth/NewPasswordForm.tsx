'use client'

import { useActionState, useTransition } from 'react'
import { useSubmitHandler } from '@/components/ui/ActionForm'
import { PasswordInput, buttonClass } from '@/components/ui'
import { updatePassword, type NewPasswordState } from './actions'

export function NewPasswordForm() {
  const [state, dispatch, pending] = useActionState<NewPasswordState, FormData>(updatePassword, { error: null })
  const [, startTransition] = useTransition()
  const submit = useSubmitHandler(dispatch, startTransition)
  return (
    <form onSubmit={submit} className="space-y-4">
      <PasswordInput name="password" label="Nueva contraseña (mínimo 8, con letras y números)" autoComplete="new-password" minLength={8} />
      <PasswordInput name="confirm" label="Repite la contraseña" autoComplete="new-password" minLength={8} />
      {state.error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass('primary', 'lg', 'w-full')}>{pending ? 'Guardando…' : 'Guardar y entrar'}</button>
    </form>
  )
}
