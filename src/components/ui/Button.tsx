import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
  secondary: 'border border-line bg-white text-ink hover:bg-surface',
  ghost: 'text-muted hover:bg-surface hover:text-ink',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  /** Función aún no disponible: se muestra deshabilitada con la etiqueta "Pronto". */
  soon?: boolean
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', soon, children, disabled, title, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        VARIANTS[variant],
        className,
      )}
      disabled={disabled || soon}
      title={soon ? 'Disponible pronto' : title}
      {...props}
    >
      {children}
      {soon && <span className="rounded bg-surface px-1 text-[10px] font-normal text-muted">Pronto</span>}
    </button>
  )
}
