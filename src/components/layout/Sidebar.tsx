'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MODULES, SETTINGS_MODULE, findModule, type ModuleNav } from '@/config/navigation'
import { cn } from '@/lib/cn'

function RailLink({ module, active }: { module: ModuleNav; active: boolean }) {
  const Icon = module.icon
  return (
    <Link
      href={module.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition',
        active ? 'bg-brand-100 text-brand-700' : 'text-muted hover:bg-surface hover:text-ink',
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {module.label}
    </Link>
  )
}

export function Sidebar() {
  const active = findModule(usePathname())
  return (
    <nav aria-label="Módulos" className="scroll-thin flex w-20 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-white px-2 py-3">
      <Link href="/inicio" aria-label="Momo AI, inicio" className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent text-lg font-bold text-white shadow-lg shadow-brand-500/30">
        M
      </Link>
      {MODULES.map((m) => <RailLink key={m.href} module={m} active={active?.href === m.href} />)}
      <div className="mt-auto w-full pt-2">
        <RailLink module={SETTINGS_MODULE} active={active?.href === SETTINGS_MODULE.href} />
      </div>
    </nav>
  )
}
