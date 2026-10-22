'use client'

import { BookOpen, Bot, Filter, Merge, Plus } from 'lucide-react'
import Link from 'next/link'
import { Mascot } from '@/components/brand'
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
            <Button soon><Merge className="h-4 w-4" /> Fusionar asistentes</Button>
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar asistentes..." className="w-52" />
            <Button soon><Filter className="h-4 w-4" /> Filtros</Button>
            <Button variant="primary" soon><Plus className="h-4 w-4" /> Crear</Button>
          </>} />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {shown.map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex items-center justify-between">
              <Badge tone="brand">Escenarios</Badge>
              <Badge tone="success">{a.scenarioCoverage}%</Badge>
            </div>
            <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100"><Mascot className="h-12 w-12" title="" /></div>
            <h3 className="mt-3 text-center font-semibold">{a.name}</h3>
            <p className="text-center text-xs text-muted">Utilizado en 1 embudo</p>
            <p className="mx-auto mt-1 w-fit rounded bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">{a.pipelineName}</p>
            <Link href="/asistentes/conocimiento"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              <BookOpen className="h-4 w-4" aria-hidden /> Ver y editar conocimiento
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
