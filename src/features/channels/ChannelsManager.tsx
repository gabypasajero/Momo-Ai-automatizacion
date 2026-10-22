'use client'

import { ArrowRight, Columns3, FlaskConical, Gauge, Link2, MoreVertical, Plus, Smartphone, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Badge, Button, Card, ChannelIcon, PageHeader, SearchInput } from '@/components/ui'
import { CHANNELS, CHANNEL_ORDER } from '@/config/channels'
import type { ChannelAccount, Pipeline } from '@/lib/data/types'

export function ChannelsManager({ accounts, pipeline }: { accounts: ChannelAccount[]; pipeline: Pipeline }) {
  const [query, setQuery] = useState('')
  const [linked, setLinked] = useState(accounts.filter((a) => a.pipelineIds.includes(pipeline.id)).map((a) => a.id))

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card className="flex flex-col p-4">
        <PageHeader icon={Smartphone} title="Canales conectados" description="Administra tus canales conectados" />
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar canal" className="mt-4" />
        <div className="mt-2 flex-1 space-y-3">
          {CHANNEL_ORDER.map((type) => {
            const items = accounts.filter((a) => a.type === type && a.name.toLowerCase().includes(query.toLowerCase()))
            if (items.length === 0) return null
            return (
              <section key={type}>
                <h3 className="mt-3 text-xs font-semibold uppercase text-muted">{CHANNELS[type].label}</h3>
                {items.map((a) => (
                  <div key={a.id} className="mt-2 flex items-center gap-3 rounded-lg p-2 hover:bg-surface">
                    <ChannelIcon channel={a.type} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-medium">{a.name} {a.official && <Badge tone="success">API</Badge>}</p>
                      <p className="truncate text-xs text-muted">{a.handle}</p>
                    </div>
                    <Link2 className="h-4 w-4 text-muted" aria-hidden /><MoreVertical className="h-4 w-4 text-muted" aria-hidden />
                  </div>
                ))}
              </section>
            )
          })}
        </div>
        <Button variant="primary" className="mt-4" soon><Plus className="h-4 w-4" /> Agregar canal</Button>
      </Card>

      <Card className="p-4">
        <PageHeader icon={Columns3} title="Asocia canales a tus embudos" description="Vincula tus canales de comunicación con tus embudos." />
        <div className="mt-4 rounded-xl border border-line p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-auto"><p className="text-sm font-semibold">{pipeline.name}</p><p className="text-xs text-muted">Canales asociados</p></div>
            <Button soon><FlaskConical className="h-4 w-4" /> A/B Testing</Button>
            <Button soon><Gauge className="h-4 w-4" /> Límite</Button>
            <Link href="/embudo" className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface"><ArrowRight className="h-4 w-4" aria-hidden /> Ir al embudo</Link>
            <Button variant="primary" disabled={linked.length === accounts.length} onClick={() => setLinked(accounts.map((a) => a.id))}><Plus className="h-4 w-4" /> Asociar todos</Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {accounts.filter((a) => linked.includes(a.id)).map((a) => (
              <div key={a.id} className="rounded-xl border border-line p-3">
                <div className="flex justify-between">
                  <ChannelIcon channel={a.type} size="lg" />
                  <button type="button" aria-label={`Desasociar ${a.name}`} onClick={() => setLinked((l) => l.filter((x) => x !== a.id))}><X className="h-4 w-4 text-muted" /></button>
                </div>
                <p className="mt-2 text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted">{a.handle}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
