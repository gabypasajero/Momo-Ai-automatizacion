import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, ChannelIcon, KpiCard } from '@/components/ui'
import type { Ticket } from '@/lib/data/types'
import { formatClp } from '@/lib/format'

export function HomeOverview({ tickets, aiCoverage, userName }: { tickets: Ticket[]; aiCoverage: number; userName: string }) {
  const open = tickets.filter((t) => t.status === 'open')
  const needsHuman = open.filter((t) => !t.aiHandled)
  const pipelineValue = open.reduce((sum, t) => sum + t.valueClp, 0)

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-4 border-0 bg-gradient-to-br from-brand-500 to-accent p-6 text-white">
        <div className="mr-auto">
          <p className="text-sm opacity-80">Hola, {userName} 👋</p>
          <h2 className="text-2xl font-bold">Tu IA respondió el {aiCoverage.toLocaleString('es-CL')}% de los mensajes este mes</h2>
          <p className="mt-1 text-sm opacity-80">Revisa las conversaciones que esperan a una persona.</p>
        </div>
        <Link href="/analitica" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700">Ver analítica</Link>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Valor en embudo (CLP)" value={formatClp(pipelineValue)} />
        <KpiCard label="Tickets abiertos" value={open.length} />
        <KpiCard label="Ventas ganadas" value={tickets.filter((t) => t.status === 'won').length} />
      </div>
      <Card className="p-4">
        <h2 className="font-semibold">Requieren atención humana ({needsHuman.length})</h2>
        <ul className="mt-2 divide-y divide-line">
          {needsHuman.map((t) => (
            <li key={t.id}>
              <Link href="/embudo" className="flex items-center gap-3 py-2 hover:bg-surface">
                <ChannelIcon channel={t.channel} />
                <span className="text-sm font-medium">{t.contactName}</span>
                <span className="truncate text-xs text-muted">{t.lastMessage}</span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
