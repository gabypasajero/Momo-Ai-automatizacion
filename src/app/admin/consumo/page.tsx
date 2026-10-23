import type { Metadata } from 'next'
import { Card, CardTitle, EmptyState, PageTitle, Tabs } from '@/components/ui'
import { aiUsage } from '@/features/admin/queries'
import { formatClp, formatNumber, formatShortDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Consumo de IA' }

const USD_CLP = 950
const PERIODS = [7, 30, 90] as const

export default async function ConsumoPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams
  const days = PERIODS.find((d) => String(d) === p) ?? 30
  const rows = await aiUsage(days)

  const byOrg = new Map<string, { name: string; calls: number; cost: number; tokens: number }>()
  for (const r of rows) {
    const o = byOrg.get(r.organization_id) ?? { name: r.organization_name, calls: 0, cost: 0, tokens: 0 }
    byOrg.set(r.organization_id, { name: o.name, calls: o.calls + r.calls, cost: o.cost + r.cost_usd, tokens: o.tokens + r.input_tokens + r.output_tokens + r.cache_read_tokens })
  }
  const totalCost = rows.reduce((s, r) => s + r.cost_usd, 0)
  const totalCalls = rows.reduce((s, r) => s + r.calls, 0)

  return (
    <div className="space-y-5">
      <PageTitle title="Consumo de IA" description={`Últimos ${days} días · lo que se descuenta del saldo de Anthropic`}
        actions={<Tabs label="Periodo" active={String(days)} items={PERIODS.map((d) => ({ id: String(d), label: `${d} días`, href: `/admin/consumo?p=${d}` }))} />} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm font-bold text-muted">Costo total</p><p className="mt-1 text-2xl font-extrabold">{formatClp(totalCost * USD_CLP)}</p><p className="text-xs text-muted">US$ {totalCost.toFixed(2)}</p></Card>
        <Card className="p-5"><p className="text-sm font-bold text-muted">Respuestas generadas</p><p className="mt-1 text-2xl font-extrabold">{formatNumber(totalCalls)}</p></Card>
        <Card className="p-5"><p className="text-sm font-bold text-muted">Costo promedio</p><p className="mt-1 text-2xl font-extrabold">{totalCalls ? formatClp((totalCost * USD_CLP) / totalCalls) : '—'}</p><p className="text-xs text-muted">por respuesta</p></Card>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Sin consumo en este periodo" description="Cuando Momo sugiera respuestas o el equipo use el asistente, verás aquí el costo por empresa y por día." />
      ) : (
        <>
          <Card className="space-y-3 p-5">
            <CardTitle>Por empresa</CardTitle>
            <table className="w-full text-sm">
              <caption className="sr-only">Consumo por empresa</caption>
              <thead className="text-left text-xs uppercase text-muted"><tr><th scope="col" className="pb-2">Empresa</th><th scope="col" className="pb-2 text-right">Respuestas</th><th scope="col" className="pb-2 text-right">Tokens</th><th scope="col" className="pb-2 text-right">Costo</th></tr></thead>
              <tbody className="divide-y divide-line">
                {[...byOrg.entries()].sort((a, b) => b[1].cost - a[1].cost).map(([id, o]) => (
                  <tr key={id}><td className="py-2 font-semibold">{o.name}</td><td className="py-2 text-right">{formatNumber(o.calls)}</td><td className="py-2 text-right">{formatNumber(o.tokens)}</td><td className="py-2 text-right font-bold">{formatClp(o.cost * USD_CLP)}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="space-y-3 p-5">
            <CardTitle>Detalle por día</CardTitle>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Consumo por día</caption>
                <thead className="text-left text-xs uppercase text-muted"><tr><th scope="col" className="pb-2">Día</th><th scope="col" className="pb-2">Empresa</th><th scope="col" className="pb-2">Uso</th><th scope="col" className="pb-2 text-right">Respuestas</th><th scope="col" className="pb-2 text-right">Costo</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={`${r.day}-${r.organization_id}-${r.feature}`}>
                      <td className="py-2">{formatShortDate(`${r.day}T12:00:00`)}</td><td className="py-2">{r.organization_name}</td>
                      <td className="py-2">{r.feature === 'vendedor' ? 'Momo vendedor' : 'Asistente interno'}</td>
                      <td className="py-2 text-right">{r.calls}</td><td className="py-2 text-right font-bold">{formatClp(r.cost_usd * USD_CLP)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      <p className="text-xs text-muted">Pesos aproximados con US$1 = {formatClp(USD_CLP)}. Precios: Opus 5.5 US$4 entrada / US$20 salida por millón de tokens.</p>
    </div>
  )
}
