'use client'

import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { buttonClass, type ButtonSize, type ButtonVariant } from './Button'
import { cn } from '@/lib/cn'

const ModalContext = createContext<{ close: () => void } | null>(null)

/** Cierra el modal que contiene al componente (no hace nada fuera de un modal). */
export function useModal() {
  return useContext(ModalContext)
}

interface ModalProps {
  /** Contenido del botón que abre el modal. */
  trigger: ReactNode
  triggerVariant?: ButtonVariant
  triggerSize?: ButtonSize
  triggerClassName?: string
  triggerLabel?: string
  disabled?: boolean
  title: string
  description?: ReactNode
  size?: 'md' | 'lg'
  children: ReactNode
}

/** Botón + ventana modal accesible (dialog nativo: foco atrapado, Esc para cerrar). */
export function Modal({ trigger, triggerVariant = 'secondary', triggerSize = 'md', triggerClassName, triggerLabel, disabled, title, description, size = 'md', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button type="button" disabled={disabled} aria-label={triggerLabel} onClick={() => setOpen(true)}
        className={buttonClass(triggerVariant, triggerSize, triggerClassName)}>
        {trigger}
      </button>
      <dialog ref={ref} aria-labelledby={titleId} onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        className={cn('m-auto w-[calc(100%-2rem)] rounded-3xl bg-white p-0 text-ink shadow-pop', size === 'lg' ? 'max-w-2xl' : 'max-w-lg')}>
        {open && (
          <ModalContext.Provider value={{ close }}>
            <div className="max-h-[85vh] overflow-y-auto p-6">
              <div className="mb-4 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="font-display text-xl font-bold">{title}</h2>
                  {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                </div>
                <button type="button" onClick={close} aria-label="Cerrar" className="rounded-full p-2 text-muted hover:bg-brand-50 hover:text-ink">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              {children}
            </div>
          </ModalContext.Provider>
        )}
      </dialog>
    </>
  )
}
