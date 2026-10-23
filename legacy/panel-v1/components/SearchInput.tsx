'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder, className }: Props) {
  return (
    <label className={cn('flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus-within:border-brand-400', className)}>
      <Search className="h-4 w-4 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent outline-none placeholder:text-muted"
      />
    </label>
  )
}
