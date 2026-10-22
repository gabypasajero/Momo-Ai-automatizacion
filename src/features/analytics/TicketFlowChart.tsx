import { Card } from '@/components/ui'
import type { AnalyticsSummary } from '@/lib/data/types'

/** Diagrama tipo Sankey simplificado: Inicial → etapas de destino. */
export function TicketFlowChart({ flow }: { flow: AnalyticsSummary['ticketFlow'] }) {
  const total = flow.reduce((s, f) => s + f.count, 0)
  if (total === 0) {
    return (
      <Card className="p-5">
        <h3 className="mb-2 text-sm font-medium">Ruta del ticket</h3>
        <p className="py-16 text-center text-sm text-muted">Aún no hay tickets en los últimos 30 días.</p>
      </Card>
    )
  }
  const source = { y: 90, h: 120 }
  let targetY = 10
  let sourceY = source.y

  return (
    <Card className="p-5">
      <h3 className="mb-2 text-sm font-medium">Ruta del ticket</h3>
      <svg viewBox="0 0 520 300" className="w-full" role="img" aria-label="Flujo de tickets desde la etapa inicial">
        <rect x="10" y={source.y} width="14" height={source.h} rx="3" fill="rgb(var(--brand-700))" />
        <text x="30" y={source.y - 6} fontSize="11" fill="rgb(var(--muted))">Inicial ({total})</text>
        {flow.map((f) => {
          const h = (f.count / total) * 230
          const sh = (f.count / total) * source.h
          const path = `M24 ${sourceY} C 200 ${sourceY}, 200 ${targetY}, 380 ${targetY} L380 ${targetY + h} C 200 ${targetY + h}, 200 ${sourceY + sh}, 24 ${sourceY + sh} Z`
          const node = (
            <g key={f.label}>
              <path d={path} fill={f.color} opacity="0.25" />
              <rect x="380" y={targetY} width="12" height={h} rx="3" fill={f.color} />
              <text x="398" y={targetY + h / 2 + 4} fontSize="11" fill="rgb(var(--ink))">{f.label} · {f.count}</text>
            </g>
          )
          targetY += h + 12
          sourceY += sh
          return node
        })}
      </svg>
    </Card>
  )
}
