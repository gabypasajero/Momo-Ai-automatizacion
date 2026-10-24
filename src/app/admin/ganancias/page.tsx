import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, Card, CardTitle, PageTitle } from '@/components/ui'
import { businessNumbers, USD_CLP } from '@/features/admin/metrics'
import { aiUsage, listCompanies } from '@/features/admin/queries'
import { Bars, Columns, DarkPanel, Stat } from '@/features/admin/ui/ControlParts'
import { formatClp, formatPercent, formatShortDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Ganancias' }

export default async function GananciasPage() {
  const [companies, usage] = await Promise.all([listCompanies(), aiUsage(14)])
  const n = businessNumbers(companies)
  const byDay = new Map<string, number>()
  for (const u of usage) byDay.set(u.day, (byDay.get(u.day) ?? 0) + u.cost_usd * USD_CLP)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10)
    return { label: formatShortDate(`${d}T12:00:00`).split(' ')[0] ?? '', value: Math.round(byDay.get(d) ?? 0) }
  })
  const ranking = [...n.rows].filter((r) => r.company.status === 'activa').sort((a, b) => b.profit - a.profit)

  return (
    <div className="space-y-5">
      <PageTitle title="Ganancias" description="Lo que entra, lo que sale y lo que te queda cada mes." />

      <DarkPanel label="Resumen del mes">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat tone="gold" label="Te queda" value={formatClp(n.profit)} hint={n.margin === null ? 'Sin ingresos aún' : `${formatPercent(n.margin)} de lo que entra`} />
          <Stat tone="dark" label="Entra por planes" value={formatClp(n.income)} hint="cada mes" />
          <Stat tone="dark" label="Cuesta la IA" value={formatClp(n.aiCost)} hint="últimos 30 días" />
          <Stat tone="dark" label="Proyección anual" value={formatClp(n.yearly)} hint="ingreso × 12" />
        </div>
      </DarkPanel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <CardTitle>De dónde viene la plata</CardTitle>
          <Bars items={n.byPlan.filter((p) => p.price).map((p) => ({ label: p.name, value: p.income, note: `${p.count} × ${formatClp(p.price ?? 0)}` }))} format={formatClp} />
        </Card>
        <Card className="space-y-4 p-5">
          <CardTitle>Costo de IA por día</CardTitle>
          <Columns label="Costo de IA de los últimos 14 días en pesos" items={days} />
          <p className="text-sm text-muted">Últimos 14 días, en pesos. <Link href="/admin/consumo" className="font-extrabold text-brand-700 hover:underline">Ver detalle</Link></p>
        </Card>
      </div>

      <Card className="space-y-3 p-5">
        <CardTitle>Ganancia por empresa</CardTitle>
        {ranking.length === 0 ? <p className="text-sm text-muted">Aún no hay empresas activas.</p> : (
          <ul className="divide-y divide-line">
            {ranking.map((r) => (
              <li key={r.company.id}>
                <Link href={`/admin/empresas/${r.company.id}`} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="min-w-0 flex-[1_1_160px]"><span className="block truncate font-extrabold">{r.company.name}</span><span className="block text-sm text-muted">Paga {formatClp(r.income)} · IA {formatClp(r.aiCost)}</span></span>
                  <span className="font-display text-lg font-bold">{formatClp(r.profit)}</span>
                  {r.margin !== null && <Badge tone={r.margin >= 50 ? 'success' : 'danger'}>{formatPercent(r.margin)}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-xs text-muted">Pesos aproximados con US$1 = {formatClp(USD_CLP)}. No incluye el cobro de instalación ni impuestos.</p>
    </div>
  )
}
