'use client'

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const inputClass =
  'w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-surface'

/** Etiqueta asociada por id (no envuelve el campo: así el nombre accesible es solo la etiqueta). */
function Field({ id, label, hint, className, children }: { id: string; label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('text-sm', className)}>
      <label htmlFor={id} className="block">
        <span className="font-bold">{label}</span>
        {hint && <span className="ml-1 font-normal text-muted">· {hint}</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function Input({ label, hint, className, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const auto = useId()
  return <Field id={id ?? auto} label={label} hint={hint} className={className}><input id={id ?? auto} className={inputClass} {...props} /></Field>
}

export function TextArea({ label, hint, className, id, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const auto = useId()
  return <Field id={id ?? auto} label={label} hint={hint} className={className}><textarea id={id ?? auto} className={cn(inputClass, 'min-h-24 resize-y')} {...props} /></Field>
}

const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23705663' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`

export function Select({ label, hint, className, children, id, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  const auto = useId()
  return (
    <Field id={id ?? auto} label={label} hint={hint} className={className}>
      <select id={id ?? auto} className={cn(inputClass, 'appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10')} style={{ backgroundImage: SELECT_ARROW }} {...props}>
        {children}
      </select>
    </Field>
  )
}

export function Checkbox({ label, description, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-3 text-sm">
      <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-600" {...props} />
      <span><span className="font-bold">{label}</span>{description && <span className="block text-muted">{description}</span>}</span>
    </label>
  )
}
