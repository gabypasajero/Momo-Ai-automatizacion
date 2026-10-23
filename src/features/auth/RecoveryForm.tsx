'use client'

import { MailCheck } from 'lucide-react'
import { useActionState, useTransition } from 'react'
import { useSubmitHandler } from '@/components/ui/ActionForm'
import { Input, buttonClass } from '@/components/ui'
import { requestPasswordReset, type RecoveryState } from './actions'

export function RecoveryForm() {
  const [state, dispatch, pending] = useActionState<RecoveryState, FormData>(requestPasswordReset, { error: null, sent: false })
  const [, startTransition] = useTransition()
  const submit = useSubmitHandler(dispatch, startTransition)
  if (state.sent) {
    return (
      <div role="status" className="space-y-2 rounded-2xl bg-success-soft p-4 text-sm text-success">
        <MailCheck className="h-5 w-5" aria-hidden />
        <p className="font-bold">Revisa tu correo</p>
        <p>Si el correo tiene cuenta en Momo, te llegará un enlace para crear una nueva contraseña. Ábrelo <strong>en este mismo navegador</strong> y revisa también la carpeta de spam.</p>
        <p>¿No llega en 10 minutos? Pide al dueño de tu empresa una contraseña temporal.</p>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Correo" name="email" type="email" autoComplete="email" required autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      {state.error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonClass('primary', 'lg', 'w-full')}>{pending ? 'Enviando…' : 'Enviarme el enlace'}</button>
    </form>
  )
}
