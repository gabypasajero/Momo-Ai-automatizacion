'use client'

import type { SelectHTMLAttributes } from 'react'
import { inputClass } from './Field'
import { cn } from '@/lib/cn'

/** Select que envía su formulario al cambiar (cambio de rol, de empresa activa…). */
export function AutoSubmitSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, 'py-2', className)} onChange={(e) => e.currentTarget.form?.requestSubmit()} />
}
