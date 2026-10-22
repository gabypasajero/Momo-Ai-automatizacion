import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({ icon: Icon, title, description, actions }: {
  icon: LucideIcon
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-xl bg-brand-600 p-2 text-white"><Icon className="h-5 w-5" aria-hidden /></span>
      <div className="mr-auto">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
