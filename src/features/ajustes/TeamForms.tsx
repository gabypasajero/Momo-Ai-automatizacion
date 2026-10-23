'use client'

import { KeyRound, UserPlus } from 'lucide-react'
import { ActionForm, CopyButton, Input, Modal, Select, SubmitButton, useModal, type ActionState } from '@/components/ui'
import { ROLE_LABELS, ROLES, type Role } from '@/config/sales'

type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>

const ROLE_HELP: Record<Role, string> = {
  owner: 'Todo, incluido el plan y el equipo.',
  admin: 'Todo menos nombrar o quitar dueños.',
  agent: 'Atiende conversaciones, clientes y conocimiento.',
  viewer: 'Solo puede mirar.',
}

/** Resultado de crear una cuenta: la contraseña temporal se muestra una sola vez. */
export function NewAccountResult({ state }: { state: ActionState }) {
  const modal = useModal()
  const password = state.data?.password as string | null
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-success-soft px-4 py-3 font-semibold text-success">{state.message}</p>
      {password ? (
        <div className="space-y-2 rounded-2xl border border-line p-4">
          <p className="flex items-center gap-2 font-bold"><KeyRound className="h-4 w-4" aria-hidden />Contraseña temporal</p>
          <p className="text-sm text-muted">Compártela con {String(state.data?.email)} por un medio privado. Al entrar, Momo le pedirá cambiarla. No la volveremos a mostrar.</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-xl bg-surface px-3 py-2 font-mono text-lg font-bold">{password}</code>
            <CopyButton value={password} />
          </div>
        </div>
      ) : null}
      <div className="flex justify-end"><button type="button" onClick={() => modal?.close()} className="min-h-11 rounded-full bg-brand-600 px-5 font-bold text-white">Listo</button></div>
    </div>
  )
}

export function AddMemberButton({ action, allowOwner, extra }: { action: FormAction; allowOwner: boolean; extra?: Record<string, string> }) {
  return (
    <Modal trigger={<><UserPlus className="h-4 w-4" aria-hidden />Sumar persona</>} triggerVariant="primary" title="Sumar al equipo"
      description="Si la persona no tiene cuenta, se crea con una contraseña temporal que verás una sola vez.">
      <ActionForm action={action} renderSuccess={(state) => <NewAccountResult state={state} />} className="space-y-4">
        {extra && Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <Input label="Nombre" name="name" required maxLength={80} autoComplete="off" />
        <Input label="Correo" name="email" type="email" required maxLength={160} autoComplete="off" />
        <Select label="Rol" name="role" defaultValue="agent">
          {ROLES.filter((r) => allowOwner || r !== 'owner').map((r) => <option key={r} value={r}>{ROLE_LABELS[r]} — {ROLE_HELP[r]}</option>)}
        </Select>
        <div className="flex justify-end"><SubmitButton pendingLabel="Creando…">Sumar al equipo</SubmitButton></div>
      </ActionForm>
    </Modal>
  )
}
