import type { Metadata } from 'next'
import { Card, CardTitle, PageTitle, Tabs } from '@/components/ui'
import { CHANNELS } from '@/config/sales'
import { PERIODS, getResults, type Period } from '@/features/resultados/queries'
import { cn } from '@/lib/cn'
import { formatClp, formatNumber, formatPercent, formatShortDate } from '@/lib/format'
import { canManage, getSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Resultados' }

/** Tipo de cambio de referencia para mostrar el costo de la IA en pesos. */
const USD_CLP = 950

function Stat({ label, value, hint, tone = 'neutral' }: { label: string; value: string; hint?: string; tone?: 'neutral' | 'success' | 'brand' | 'accent' }) {
  return (
    <div className={cn('rounded-3xl p-5',
      tone === 'success' && 'bg-success-soft text-success', tone === 'brand' && 'bg-brand-50 text-brand-700',
      tone === 'accent' && 'bg-accent-soft text-accent-strong', tone === 'neutral' && 'border border-line bg-white')}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {hint && <p className={cn('mt-0.5 text-xs', tone === 'neutral' && 'text-muted')}>{hint}</p>}
    </div>
  )
}

export default async function ResultadosPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const params = await searchParams
  const session = await getSession()
  const days: Period = PERIODS.find((p) => String(p) === params.p) ?? 30
  const manager = canManage(session.role)
  const r = await getResults(session, days, manager)
  const maxDay = Math.max(1, ...r.byDay.map((d) => d.total))
  const maxChannel = Math.max(1, ...r.byChannel.map((c) => c.count))
  const step = days === 90 ? 7 : days === 30 ? 5 : 1

  return (
    <div className="space-y-5">
      <PageTitle title="Resultados" description={`Últimos ${days} días`}
        actions={<Tabs label="Periodo" active={String(days)} items={PERIODS.map((p) => ({ id: String(p), label: `${p} días`, href: `/resultados?p=${p}` }))} />} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat tone="success" label="Vendido" value={formatClp(r.sold)} hint={`${r.salesCount} ${r.salesCount === 1 ? 'venta' : 'ventas'} · promedio ${formatClp(r.average)}`} />
        <Stat tone="brand" label="Conversaciones nuevas" value={formatNumber(r.newConversations)} hint={r.conversion === null ? 'Sin ventas iniciadas' : `${formatPercent(r.conversion)} terminó en venta`} />
        <Stat tone="accent" label="Respondió Momo" value={r.momoShare === null ? '—' : formatPercent(r.momoShare)} hint={`${formatNumber(r.momoReplies)} respuestas de Momo`} />
        <Stat label="Ventas perdidas" value={formatNumber(r.lost)} hint={r.lostReasons[0] ? `Motivo principal: ${r.lostReasons[0].reason}` : 'Anota el motivo al perder una venta'} />
      </div>

      <Card className="space-y-4 p-5">
        <CardTitle>Ventas por día</CardTitle>
        {r.sold === 0 ? <p className="text-sm text-muted">Aún no hay ventas pagadas en este periodo.</p> : (
          <figure>
            <div className="flex h-48 items-end gap-[2px]" role="img" aria-label={`Ventas por día. Total ${formatClp(r.sold)}. Mejor día ${formatClp(maxDay)}.`}>
              {r.byDay.map((d) => (
                <div key={d.day} className="group relative flex h-full flex-1 items-end" title={`${formatShortDate(`${d.day}T12:00:00`)}: ${formatClp(d.total)}`}>
                  <div className={cn('w-full rounded-t-md', d.total > 0 ? 'bg-brand-600' : 'bg-brand-50')} style={{ height: `${Math.max(2, (d.total / maxDay) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-[2px] text-[11px] text-muted" aria-hidden>
              {r.byDay.map((d, i) => <span key={d.day} className="flex-1 text-center">{i % step === 0 ? formatShortDate(`${d.day}T12:00:00`) : ''}</span>)}
            </div>
          </figure>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <CardTitle>Lo más vendido</CardTitle>
          {r.topProducts.length === 0 ? <p className="text-sm text-muted">Sin ventas en este periodo.</p> : (
            <table className="w-full text-sm">
              <caption className="sr-only">Productos más vendidos</caption>
              <thead className="text-left text-xs uppercase text-muted"><tr><th scope="col" className="pb-2">Producto</th><th scope="col" className="pb-2 text-right">Ventas</th><th scope="col" className="pb-2 text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-line">
                {r.topProducts.map((p) => <tr key={p.name}><td className="py-2 font-semibold">{p.name}</td><td className="py-2 text-right">{p.count}</td><td className="py-2 text-right font-bold">{formatClp(p.total)}</td></tr>)}
              </tbody>
            </table>
          )}
        </Card>
        <Card className="space-y-3 p-5">
          <CardTitle>Por dónde llegan</CardTitle>
          {r.byChannel.length === 0 ? <p className="text-sm text-muted">Sin conversaciones nuevas en este periodo.</p> : (
            <ul className="space-y-3">
              {r.byChannel.map((c) => (
                <li key={c.channel} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 font-semibold">{CHANNELS[c.channel].label}</span>
                  <span className="h-3 flex-1 rounded-full bg-brand-50" aria-hidden><span className="block h-3 rounded-full bg-brand-600" style={{ width: `${(c.count / maxChannel) * 100}%` }} /></span>
                  <span className="w-10 shrink-0 text-right font-bold">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {r.lostReasons.length > 0 && (
          <Card className="space-y-3 p-5">
            <CardTitle>Por qué se pierden ventas</CardTitle>
            <ul className="divide-y divide-line text-sm">
              {r.lostReasons.map((l) => <li key={l.reason} className="flex justify-between gap-3 py-2"><span>{l.reason}</span><span className="font-bold">{l.count}</span></li>)}
            </ul>
          </Card>
        )}
        {r.aiCostUsd !== null && (
          <Card className="space-y-2 p-5">
            <CardTitle>Costo de la IA</CardTitle>
            <p className="text-2xl font-extrabold">{formatClp(r.aiCostUsd * USD_CLP)}</p>
            <p className="text-sm text-muted">US$ {r.aiCostUsd.toFixed(2)} en {days} días (aprox. con US$1 = {formatClp(USD_CLP)}). Solo lo ven dueños y administradores.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
