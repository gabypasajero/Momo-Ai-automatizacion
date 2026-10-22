import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from './Card'

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-brand-300" aria-hidden />
      <h2 className="mt-3 font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}
