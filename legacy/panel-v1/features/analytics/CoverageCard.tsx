import { Card } from '@/components/ui'
import type { AnalyticsSummary } from '@/lib/data/types'
import { formatNumber } from '@/lib/format'
import { StackedBar } from './StackedBar'

export function CoverageCard({ coverage }: { coverage: AnalyticsSummary['aiCoverage'] }) {
  const { messages, conversations } = coverage
  return (
    <Card className="grid gap-6 p-5 md:grid-cols-[160px_1fr]">
      <div>
        <p className="text-sm text-muted">Cobertura de IA</p>
        <p className="mt-4 text-4xl font-bold text-brand-600">{coverage.percent.toLocaleString('es-CL')}%</p>
        <p className="text-sm font-medium">Mensajes IA</p>
        <p className="mt-1 text-xs text-muted">{formatNumber(messages.ai)} de {formatNumber(messages.ai + messages.human)} mensajes enviados por IA</p>
      </div>
      <div className="space-y-6 self-center">
        <StackedBar title="Mensajes" parts={[
          { label: 'IA', value: messages.ai, className: 'bg-brand-500' },
          { label: 'Humano', value: messages.human, className: 'bg-warning-chart' },
        ]} />
        <StackedBar title="Conversaciones" parts={[
          { label: 'Solo IA', value: conversations.aiOnly, className: 'bg-brand-500' },
          { label: 'Mixto', value: conversations.mixed, className: 'bg-success-chart' },
          { label: 'Solo humano', value: conversations.humanOnly, className: 'bg-warning-chart' },
        ]} />
      </div>
    </Card>
  )
}
