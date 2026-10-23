import { CalendarDays, ChevronDown } from 'lucide-react'
import { Button, KpiCard } from '@/components/ui'
import type { AnalyticsSummary } from '@/lib/data/types'
import { CoverageCard } from './CoverageCard'
import { HourlyHeatmap } from './HourlyHeatmap'
import { ResolutionDonut } from './ResolutionDonut'
import { TicketFlowChart } from './TicketFlowChart'

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase text-muted">Conversaciones</h2>
        <Button><CalendarDays className="h-4 w-4" /> Últimos 30 días <ChevronDown className="h-4 w-4" /></Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summary.conversationKpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <CoverageCard coverage={summary.aiCoverage} />
        <HourlyHeatmap data={summary.heatmap} />
      </div>
      <h2 className="pt-2 text-xs font-semibold uppercase text-muted">Tickets</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.ticketKpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <TicketFlowChart flow={summary.ticketFlow} />
        <ResolutionDonut {...summary.resolution} />
      </div>
    </div>
  )
}
