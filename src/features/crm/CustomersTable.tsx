'use client'

import { Download, Eye, Megaphone, Merge, MessageCircle, Upload } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Badge, Button, Card, ChannelIcon, SearchInput } from '@/components/ui'
import type { Contact } from '@/lib/data/types'

export function CustomersTable({ contacts, total }: { contacts: Contact[]; total: number }) {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()
  const rows = contacts.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q))

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <div className="mr-auto"><h2 className="font-semibold">Clientes</h2><p className="text-sm text-muted">Mostrando {rows.length} de {total} clientes</p></div>
        <Button><Megaphone className="h-4 w-4" /> Enviar campaña</Button>
        <Button><Merge className="h-4 w-4" /> Fusionar clientes</Button>
        <Button><Upload className="h-4 w-4" /> Importar</Button>
        <Button><Download className="h-4 w-4" /> Exportar</Button>
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar clientes..." className="w-52" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Cliente</th><th>Canal</th><th>Etiqueta</th><th>Responsable</th><th><span className="sr-only">Acciones</span></th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="p-3"><div className="flex items-center gap-3"><Avatar name={c.name} className="bg-brand-600" /><div><p className="font-medium">{c.name}</p><p className="text-xs text-muted">{c.phone ?? '—'}</p></div></div></td>
                <td><ChannelIcon channel={c.channel} /></td>
                <td><Badge>{c.tag}</Badge></td>
                <td className="text-muted">{c.ownerName ?? '—'}</td>
                <td className="pr-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm"><MessageCircle className="h-3.5 w-3.5" /> Chat</Button>
                    <Button size="sm"><Eye className="h-3.5 w-3.5" /> Ver</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
