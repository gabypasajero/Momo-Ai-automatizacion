'use client'

import { MailCheck, Send } from 'lucide-react'
import { useActionState } from 'react'
import { Button } from '@/components/ui'
import { requestPasswordReset, type RecoveryState } from './actions'

export function RecoveryForm() {
  const [state, action, pending] = useActionState<RecoveryState, FormData>(requestPasswordReset, { error: null, sent: false })
  if (state.sent) {
    return (
      <div role="status" className="rounded-lg bg-success-soft p-4 text-sm text-success">
        <MailCheck className="mb-2 h-5 w-5" aria-hidden />
        Si el correo tiene cuenta en Momo, te llegará un enlace para crear una nueva contraseña.
        Ábrelo <strong>en este mismo navegador</strong>. Revisa también la carpeta de spam.
      </div>
    )
  }
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium">Correo</span>
        <input name="email" type="email" autoComplete="email" required autoCapitalize="none" autoCorrect="off" spellCheck={false}
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-brand-500" />
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="primary" disabled={pending} className="w-full py-2">
        <Send className="h-4 w-4" /> {pending ? 'Enviando…' : 'Enviarme el enlace'}
      </Button>
    </form>
  )
}
