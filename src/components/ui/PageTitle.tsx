import type { ReactNode } from 'react'

/** Encabezado de cada pantalla: título grande y acciones a la derecha. */
export function PageTitle({ eyebrow, title, description, actions }: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end gap-4">
      <div className="min-w-0 flex-[1_1_320px]">
        {eyebrow && <p className="font-semibold text-muted">{eyebrow}</p>}
        <h1 className="font-display text-[28px] font-bold leading-tight md:text-[32px]">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
