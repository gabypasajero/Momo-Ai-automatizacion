'use client'

import Link from 'next/link'
import { useActionState, useTransition } from 'react'
import { useSubmitHandler } from '@/components/ui/ActionForm'
import { Input, PasswordInput, buttonClass } from '@/components/ui'
import { signIn, type LoginState } from './actions'

export function LoginForm({ next }: { next: string }) {
  const [state, dispatch, pending] = useActionState<LoginState, FormData>(signIn, { error: null })
  const [, startTransition] = useTransition()
  const submit = useSubmitHandler(dispatch, startTransition)
  return (
    <form onSubmit={submit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Input label="Correo" name="email" type="email" autoComplete="email" required autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <PasswordInput name="password" label="Contraseña" autoComplete="current-password" />
      {state.error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass('primary', 'lg', 'w-full')}>{pending ? 'Ingresando…' : 'Ingresar'}</button>
      <p className="text-center text-sm"><Link href="/recuperar" className="font-bold text-brand-700 hover:underline">¿Olvidaste tu contraseña?</Link></p>
    </form>
  )
}
