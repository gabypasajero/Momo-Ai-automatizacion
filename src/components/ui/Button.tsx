import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'accent' | 'danger' | 'light'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50',
  ghost: 'text-muted hover:bg-brand-50 hover:text-ink',
  success: 'bg-success text-white hover:brightness-110',
  accent: 'bg-accent-strong text-white hover:brightness-110',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-danger-soft',
  light: 'bg-white text-brand-700 hover:bg-brand-50',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
}

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant], SIZES[size], className,
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
}

/** Enlace con aspecto de botón; navega en la misma pestaña. */
export function ButtonLink({ href, variant, size, className, ...props }: ButtonLinkProps) {
  return <Link href={href} className={buttonClass(variant, size, className)} {...props} />
}
