import { cn } from '@/lib/cn'

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white', className)}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
