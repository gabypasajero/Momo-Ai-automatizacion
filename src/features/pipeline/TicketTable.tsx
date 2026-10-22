import { Card, ChannelIcon } from '@/components/ui'
import type { PipelineStage, Ticket } from '@/lib/data/types'
import { formatClp } from '@/lib/format'

export function TicketTable({ tickets, stages }: { tickets: Ticket[]; stages: PipelineStage[] }) {
  const stageName = (id: string) => stages.find((s) => s.id === id)?.name ?? '—'
  return (
    <Card className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs uppercase text-muted">
          <tr><th className="p-3">Cliente</th><th>Canal</th><th>Etapa</th><th>Estado IA</th><th>Valor</th><th>Hora</th></tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-t border-line">
              <td className="p-3 font-medium">{t.contactName}</td>
              <td><ChannelIcon channel={t.channel} /></td>
              <td>{stageName(t.stageId)}</td>
              <td className={t.aiHandled ? 'text-success' : 'text-danger'}>{t.aiHandled ? 'Atendido por IA' : 'No atendido'}</td>
              <td>{formatClp(t.valueClp)}</td>
              <td>{t.lastMessageAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
