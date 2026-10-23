'use client'

import { KeyRound, Plus } from 'lucide-react'
import { ActionForm, Input, Modal, Select, SubmitButton } from '@/components/ui'
import { PLANS } from '@/config/plans'
import { NewAccountResult } from '@/features/ajustes/TeamForms'
import { adminResetPassword, createCompany } from './actions'

export function CreateCompanyButton() {
  return (
    <Modal trigger={<><Plus className="h-4 w-4" aria-hidden />Nueva empresa</>} triggerVariant="primary" title="Nueva empresa"
      description="Se crea con su asistente Momo listo y su dueño. Si el dueño no tiene cuenta, verás una contraseña temporal una sola vez." size="lg">
      <ActionForm action={createCompany} renderSuccess={(state) => <NewAccountResult state={state} />} className="space-y-4">
        <Input label="Nombre de la empresa" name="name" required maxLength={120} placeholder="Muebles del Sur" />
        <Select label="Plan" name="plan" defaultValue="pyme">
          {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre del dueño" name="owner_name" required maxLength={80} autoComplete="off" />
          <Input label="Correo del dueño" name="owner_email" type="email" required maxLength={160} autoComplete="off" />
        </div>
        <div className="flex justify-end"><SubmitButton pendingLabel="Creando…">Crear empresa</SubmitButton></div>
      </ActionForm>
    </Modal>
  )
}

export function ResetPasswordButton({ userId, label }: { userId: string; label: string }) {
  return (
    <Modal trigger={<KeyRound className="h-4 w-4" aria-hidden />} triggerLabel={`Nueva contraseña temporal para ${label}`} triggerVariant="ghost" triggerSize="sm"
      title="Crear contraseña temporal" description={`Se reemplaza la contraseña de ${label}. Deberá cambiarla al entrar. Si usa la misma cuenta en la tienda DTO, también cambia allá.`}>
      <ActionForm action={adminResetPassword} renderSuccess={(state) => <NewAccountResult state={state} />} className="space-y-4">
        <input type="hidden" name="user_id" value={userId} />
        <div className="flex justify-end"><SubmitButton pendingLabel="Creando…">Crear contraseña temporal</SubmitButton></div>
      </ActionForm>
    </Modal>
  )
}
