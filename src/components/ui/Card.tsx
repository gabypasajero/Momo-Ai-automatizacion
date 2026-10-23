import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl border border-line bg-white', className)} {...props} />
}

/** Título de sección dentro de una tarjeta. */
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('font-display text-lg font-bold', className)}>{children}</h2>
}
