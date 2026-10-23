'use client'

import { KeyRound, LockOpen } from 'lucide-react'
import { useActionState } from 'react'
import { Button, PasswordInput } from '@/components/ui'
import { setPanelPassword, unlockPanel, type PanelFormState } from './actions'

/** Desbloqueo del panel, o creación de su contraseña la primera vez (mode="crear"). */
export function PanelPasswordForm({ mode }: { mode: 'abrir' | 'crear' }) {
  const create = mode === 'crear'
  const [state, action, pending] = useActionState<PanelFormState, FormData>(create ? setPanelPassword : unlockPanel, { error: null })
  return (
    <form action={action} className="space-y-3">
      <PasswordInput name="password" label={create ? 'Nueva contraseña del panel' : 'Contraseña del panel'}
        autoComplete={create ? 'new-password' : 'current-password'} />
      {create && <PasswordInput name="confirm" label="Repite la contraseña" autoComplete="new-password" />}
      {state.error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <Button type="submit" variant="primary" disabled={pending} className="w-full py-2">
        {create ? <KeyRound className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
        {pending ? 'Verificando…' : create ? 'Guardar y entrar' : 'Entrar al panel'}
      </Button>
    </form>
  )
}
