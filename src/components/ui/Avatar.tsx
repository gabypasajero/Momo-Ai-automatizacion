import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-extrabold text-brand-700',
        size === 'sm' && 'h-8 w-8 text-xs', size === 'md' && 'h-11 w-11 text-sm', size === 'lg' && 'h-14 w-14 text-base',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
