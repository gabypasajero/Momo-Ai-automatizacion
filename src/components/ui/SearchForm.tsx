import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Buscador que envía por GET a la misma pantalla (conserva los filtros indicados). */
export function SearchForm({ action, defaultValue, placeholder, keep = {}, className }: {
  action: string
  defaultValue?: string
  placeholder: string
  keep?: Record<string, string | undefined>
  className?: string
}) {
  return (
    <form action={action} role="search" className={cn('flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100', className)}>
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <input type="search" name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label={placeholder}
        className="w-full min-w-0 bg-transparent py-2 outline-none placeholder:text-muted/80" />
    </form>
  )
}
