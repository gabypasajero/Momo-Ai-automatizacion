'use client'

import { Plus, UserRound, X } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { ActionForm, CancelButton, Input, Modal, Select, SubmitButton, TextArea, inputClass } from '@/components/ui'
import { CHANNELS, CHANNEL_IDS } from '@/config/sales'
import { createConversation, searchContacts, type ContactOption } from './actions'

/** Registrar una conversación nueva: cliente existente o nuevo, canal y lo que escribió. */
export function NewConversation({ defaultContact, triggerLabel = 'Nueva conversación', triggerVariant = 'primary' }: {
  defaultContact?: ContactOption
  triggerLabel?: string
  triggerVariant?: 'primary' | 'secondary'
}) {
  return (
    <Modal trigger={<><Plus className="h-4 w-4" aria-hidden />{triggerLabel}</>} triggerVariant={triggerVariant} size="lg"
      title="Registrar conversación"
      description="Pega lo que te escribió el cliente en Marketplace u otro canal. Momo te ayudará a responder.">
      <ActionForm action={createConversation} className="space-y-4">
        <ContactField defaultContact={defaultContact} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Canal" name="channel" defaultValue="marketplace" required>
            {CHANNEL_IDS.map((c) => <option key={c} value={c}>{CHANNELS[c].label}</option>)}
          </Select>
          <Input label="¿Qué le interesa?" hint="opcional" name="interest" placeholder="Closet 3 puertas blanco" maxLength={160} />
        </div>
        <TextArea label="Mensaje del cliente" hint="opcional" name="message" rows={4} maxLength={4000}
          placeholder="Hola! ¿El closet lo tienen en blanco? ¿Cuánto sale con despacho a Maipú?" />
        <div className="flex flex-wrap justify-end gap-2">
          <CancelButton />
          <SubmitButton pendingLabel="Registrando…">Registrar y abrir</SubmitButton>
        </div>
      </ActionForm>
    </Modal>
  )
}

function ContactField({ defaultContact }: { defaultContact?: ContactOption }) {
  const [selected, setSelected] = useState<ContactOption | null>(defaultContact ?? null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContactOption[]>([])
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (selected || query.trim().length < 2) { setResults([]); return }
    const id = setTimeout(() => startTransition(async () => setResults(await searchContacts(query))), 250)
    return () => clearTimeout(id)
  }, [query, selected])

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-3">
        <input type="hidden" name="contact_id" value={selected.id} />
        <UserRound className="h-5 w-5 text-brand-700" aria-hidden />
        <div className="min-w-0 flex-1"><p className="font-bold">{selected.name}</p>{selected.phone && <p className="text-sm text-muted">{selected.phone}</p>}</div>
        <button type="button" onClick={() => setSelected(null)} aria-label="Cambiar cliente" className="rounded-full p-2 text-muted hover:bg-white hover:text-ink">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="block text-sm">
          <span className="font-bold">Cliente</span>
          <span className="ml-1 text-muted">· busca uno existente o escribe uno nuevo</span>
          <input name="name" value={query} onChange={(e) => setQuery(e.target.value)} required maxLength={120} autoComplete="off"
            placeholder="Nombre del cliente" className={`${inputClass} mt-1.5`} aria-autocomplete="list" />
        </label>
        {results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-line bg-white shadow-pop" role="listbox" aria-label="Clientes existentes">
            {results.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setSelected(c)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-brand-50">
                  <UserRound className="h-4 w-4 text-muted" aria-hidden /><span className="font-semibold">{c.name}</span>
                  {c.phone && <span className="text-sm text-muted">{c.phone}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Teléfono" hint="opcional" name="phone" type="tel" inputMode="tel" placeholder="+56 9 1234 5678" maxLength={40} />
        <Input label="Comuna" hint="opcional" name="comuna" placeholder="Maipú" maxLength={80} />
      </div>
    </div>
  )
}
