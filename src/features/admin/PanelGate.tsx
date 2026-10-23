import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ActionForm, PasswordInput, SubmitButton } from '@/components/ui'
import { createPanelPassword, unlockPanel } from './actions'
import type { AdminPanelState } from './queries'

/** Puerta del área de administración: contraseña propia del panel (distinta a la de la cuenta). */
export function PanelGate({ state, email }: { state: Exclude<AdminPanelState, 'abierto' | 'sin_acceso'>; email: string }) {
  const create = state === 'sin_clave'
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white"><ShieldCheck className="h-6 w-6" aria-hidden /></span>
        <h1 className="mt-4 font-display text-2xl font-bold">Administración de Momo AI</h1>
        <p className="mt-1 text-sm text-muted">
          {create
            ? 'Primera vez: crea una contraseña solo para este panel. Es distinta a la de tu cuenta y nadie más la tendrá.'
            : 'Ingresa la contraseña del panel. Se cierra solo a los 30 minutos.'}
        </p>
        <p className="mt-1 text-xs text-muted">Cuenta: {email}</p>
        {state === 'bloqueado' && <p role="alert" className="mt-3 rounded-2xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">Demasiados intentos. Vuelve a intentar en 15 minutos.</p>}
        <ActionForm action={create ? createPanelPassword : unlockPanel} className="mt-5 space-y-4">
          <PasswordInput name="password" label={create ? 'Nueva contraseña del panel (mínimo 10)' : 'Contraseña del panel'} autoComplete={create ? 'new-password' : 'current-password'} minLength={create ? 10 : undefined} />
          {create && <PasswordInput name="confirm" label="Repite la contraseña" autoComplete="new-password" minLength={10} />}
          <SubmitButton className="w-full" pendingLabel="Verificando…">{create ? 'Guardar y entrar' : 'Entrar al panel'}</SubmitButton>
        </ActionForm>
        <Link href="/hoy" className="mt-4 block text-center text-sm font-bold text-brand-700 hover:underline">Volver a mi panel</Link>
      </div>
    </main>
  )
}
