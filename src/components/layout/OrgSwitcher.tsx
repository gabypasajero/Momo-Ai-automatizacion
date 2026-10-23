'use client'

import { useId } from 'react'
import { AutoSubmitSelect } from '@/components/ui'

export interface OrgOption {
  id: string
  name: string
}

/** Cambio de empresa activa para quien pertenece a varias (se guarda en una cookie). */
export function OrgSwitcher({ current, orgs, action, className }: { current: string; orgs: OrgOption[]; action: (form: FormData) => Promise<void>; className?: string }) {
  const id = useId()
  return (
    <form action={action} className={className}>
      <label htmlFor={id} className="block text-xs font-bold text-muted">Empresa</label>
      <AutoSubmitSelect id={id} name="org" defaultValue={current} className="mt-1 text-sm font-semibold">
        {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </AutoSubmitSelect>
      <noscript><button type="submit">Cambiar</button></noscript>
    </form>
  )
}
