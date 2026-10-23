'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { buttonClass, inputClass } from '@/components/ui'

/** Personas a las que Momo deriva (nombre + teléfono), con filas que se agregan y quitan. */
export function HandoffEditor({ initial }: { initial: { label: string; phone: string }[] }) {
  const [rows, setRows] = useState(initial.length ? initial.map((r, i) => ({ ...r, key: i })) : [{ label: '', phone: '', key: 0 }])
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold">Derivar a</legend>
      <p className="text-sm text-muted">Momo ofrece estos contactos para proyectos a medida, cocinas o casos que requieren una persona.</p>
      {rows.map((row, i) => (
        <div key={row.key} className="flex flex-wrap items-center gap-2">
          <label className="min-w-0 flex-[1_1_160px]"><span className="sr-only">Nombre del contacto {i + 1}</span>
            <input name="contact_label" defaultValue={row.label} placeholder="Área de Diseño" maxLength={60} className={inputClass} /></label>
          <label className="min-w-0 flex-[1_1_160px]"><span className="sr-only">Teléfono del contacto {i + 1}</span>
            <input name="contact_phone" defaultValue={row.phone} placeholder="+56 9 1234 5678" type="tel" inputMode="tel" maxLength={40} className={inputClass} /></label>
          <button type="button" onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))} aria-label={`Quitar contacto ${i + 1}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-brand-50 hover:text-ink"><Trash2 className="h-4 w-4" aria-hidden /></button>
        </div>
      ))}
      <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setRows((r) => [...r, { label: '', phone: '', key: Date.now() }])}>
        <Plus className="h-4 w-4" aria-hidden />Agregar contacto
      </button>
    </fieldset>
  )
}
