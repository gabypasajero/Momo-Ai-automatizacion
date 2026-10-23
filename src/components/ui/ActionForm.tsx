'use client'

import { CheckCircle2, CircleAlert } from 'lucide-react'
import { createContext, useActionState, useContext, useEffect, useRef, useTransition, type FormEvent, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { buttonClass, type ButtonSize, type ButtonVariant } from './Button'
import { useModal } from './Modal'
import { cn } from '@/lib/cn'

export interface ActionState {
  ok: boolean
  message: string | null
  error: string | null
  data?: Record<string, string | number | boolean | null>
}

export const INITIAL_STATE: ActionState = { ok: false, message: null, error: null }

type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>

/**
 * Envía el formulario a mano (no con action={…}): React 19 reinicia los campos tras cada acción y,
 * al volver a los valores por defecto anteriores, la pantalla mostraría datos viejos ya guardados
 * (o borraría el correo tras una contraseña incorrecta).
 */
export function useSubmitHandler(dispatch: (data: FormData) => void, startTransition: (fn: () => void) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const data = new FormData(event.currentTarget, submitter)
    startTransition(() => dispatch(data))
  }
}

/** Estado "guardando" del ActionForm más cercano (para SubmitButton). */
const PendingContext = createContext(false)

interface ActionFormProps {
  action: FormAction
  children: ReactNode
  className?: string
  /** Cierra el modal que lo contiene al guardar bien. */
  closeOnSuccess?: boolean
  resetOnSuccess?: boolean
  /** Contenido a mostrar (en lugar del formulario) después de guardar bien, p. ej. una contraseña temporal. */
  renderSuccess?: (state: ActionState) => ReactNode
  onSuccess?: (state: ActionState) => void
}

/** Formulario conectado a una server action: muestra el resultado y se deshabilita mientras guarda. */
export function ActionForm({ action, children, className, closeOnSuccess, resetOnSuccess, renderSuccess, onSuccess }: ActionFormProps) {
  const [state, dispatch, pending] = useActionState(action, INITIAL_STATE)
  const [, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const modal = useModal()

  const submit = useSubmitHandler(dispatch, startTransition)

  useEffect(() => {
    if (!state.ok) return
    onSuccess?.(state)
    if (resetOnSuccess) formRef.current?.reset()
    if (closeOnSuccess && !renderSuccess) modal?.close()
    // Solo reacciona a cada resultado nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  if (state.ok && renderSuccess) return <>{renderSuccess(state)}</>

  return (
    <form ref={formRef} onSubmit={submit} className={className} aria-busy={pending}>
      <PendingContext.Provider value={pending}>
        <fieldset disabled={pending} className="contents">{children}</fieldset>
      </PendingContext.Provider>
      <FormMessage state={state} />
    </form>
  )
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="mt-3 flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{state.error}
      </p>
    )
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="mt-3 flex items-start gap-2 rounded-2xl bg-success-soft px-4 py-2.5 text-sm font-semibold text-success">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{state.message}
      </p>
    )
  }
  return null
}

/** Botón de envío que muestra "Guardando…" mientras la acción corre. */
export function SubmitButton({ children, pendingLabel = 'Guardando…', variant = 'primary', size = 'md', className, name, value, disabled }: {
  children: ReactNode
  pendingLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  name?: string
  value?: string
  disabled?: boolean
}) {
  const status = useFormStatus()
  const pending = useContext(PendingContext) || status.pending
  return (
    <button type="submit" name={name} value={value} disabled={pending || disabled} className={buttonClass(variant, size, cn(className))}>
      {pending ? pendingLabel : children}
    </button>
  )
}
