'use client'

import { Bot, Eye, Filter, Merge, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, PageHeader, SearchInput } from '@/components/ui'
import type { Assistant } from '@/lib/data/types'

export function AssistantGallery({ assistants }: { assistants: Assistant[] }) {
  const [query, setQuery] = useState('')
  const shown = assistants.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <PageHeader icon={Bot} title="Tus asistentes:" description={`Mostrando ${shown.length} ${shown.length === 1 ? 'asistente' : 'asistentes'}`}
          actions={<>
            <Button><Merge className="h-4 w-4" /> Fusionar asistentes</Button>
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar asistentes..." className="w-52" />
            <Button><Filter className="h-4 w-4" /> Filtros</Button>
            <Button variant="primary"><Plus className="h-4 w-4" /> Crear</Button>
          </>} />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <Badge tone="brand">Escenarios</Badge>
              <Badge tone="success">{a.scenarioCoverage}%</Badge>
            </div>
            <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-3xl" aria-hidden>{a.emoji}</div>
            <h3 className="mt-3 text-center font-semibold">{a.name}</h3>
            <p className="text-center text-xs text-muted">Utilizado en 1 embudo</p>
            <p className="mx-auto mt-1 w-fit rounded bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">{a.pipelineName}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button><Eye className="h-4 w-4" /> Ver</Button>
              <Button><Pencil className="h-4 w-4" /> Editar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
