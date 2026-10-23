'use client'

import type { ReactNode } from 'react'
import { ActionForm, SubmitButton, type ActionState } from './ActionForm'
import { buttonClass, type ButtonSize, type ButtonVariant } from './Button'
import { Modal, useModal } from './Modal'

/** Acción que pide confirmación (eliminar, archivar, quitar a alguien del equipo…). */
export function ConfirmAction({ action, fields, trigger, triggerVariant = 'danger', triggerSize = 'md', triggerClassName, triggerLabel, title, description, confirmLabel, confirmVariant = 'primary' }: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>
  fields: Record<string, string>
  trigger: ReactNode
  triggerVariant?: ButtonVariant
  triggerSize?: ButtonSize
  triggerClassName?: string
  triggerLabel?: string
  title: string
  description: ReactNode
  confirmLabel: string
  confirmVariant?: ButtonVariant
}) {
  return (
    <Modal trigger={trigger} triggerVariant={triggerVariant} triggerSize={triggerSize} triggerClassName={triggerClassName} triggerLabel={triggerLabel} title={title} description={description}>
      <ActionForm action={action} closeOnSuccess>
        {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <div className="flex flex-wrap justify-end gap-2">
          <CancelButton />
          <SubmitButton variant={confirmVariant} pendingLabel="Un momento…">{confirmLabel}</SubmitButton>
        </div>
      </ActionForm>
    </Modal>
  )
}

export function CancelButton({ label = 'Cancelar' }: { label?: string }) {
  const modal = useModal()
  return <button type="button" onClick={() => modal?.close()} className={buttonClass('secondary')}>{label}</button>
}
