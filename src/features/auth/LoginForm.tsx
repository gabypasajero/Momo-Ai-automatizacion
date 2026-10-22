'use client'

import { LogIn } from 'lucide-react'
import { useActionState } from 'react'
import { Button } from '@/components/ui'
import { signIn, type LoginState } from './actions'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: null })
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">
        <span className="font-medium">Correo</span>
        <input name="email" type="email" autoComplete="email" required
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500" />
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="primary" disabled={pending} className="w-full py-2">
        <LogIn className="h-4 w-4" /> {pending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
