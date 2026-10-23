import { Building2, Lock, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, KpiCard, PageHeader } from '@/components/ui'
import { PLANS } from '@/config/plans'
import { formatClp, formatNumber } from '@/lib/format'
import { lockPanel, setCompanyPlan } from './actions'
import type { AdminCompanyRow } from './queries'

/** Tipo de cambio de referencia para estimar márgenes; el costo real de IA se cobra en dólares. */
const USD_CLP = 950

const planPrice = (id: string) => PLANS.find((p) => p.id === id)?.priceClp ?? 0
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : '—')

export function AdminDashboard({ companies }: { companies: AdminCompanyRow[] }) {
  const mrr = companies.reduce((s, c) => s + planPrice(c.plan), 0)
  const aiCostClp = Math.round(companies.reduce((s, c) => s + c.aiCostUsd30d, 0) * USD_CLP)
  const conversations = companies.reduce((s, c) => s + c.conversations30d, 0)
  const sales = companies.reduce((s, c) => s + c.revenueWon30d, 0)

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <PageHeader icon={ShieldCheck} title="Administración de Momo AI" description="Todas las empresas de la plataforma · últimos 30 días"
          actions={<form action={lockPanel}><Button type="submit"><Lock className="h-4 w-4" /> Cerrar panel</Button></form>} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Ingreso mensual (planes)" value={formatClp(mrr)} />
        <KpiCard label="Costo de IA (aprox.)" value={formatClp(aiCostClp)} />
        <KpiCard label="Conversaciones atendidas" value={formatNumber(conversations)} />
        <KpiCard label="Ventas cerradas de clientes" value={formatClp(sales)} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line p-3">
          <Building2 className="h-4 w-4 text-brand-600" aria-hidden />
          <h2 className="font-semibold">Empresas ({companies.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-surface text-left text-xs uppercase text-muted">
              <tr>
                <th className="p-3">Empresa</th><th>Plan</th><th>Usuarios</th><th>Catálogo</th><th>Conocimiento</th>
                <th>Conversaciones</th><th>Respuestas IA</th><th>Ventas</th><th>Costo IA</th><th>Margen</th><th className="pr-3">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const cost = Math.round(c.aiCostUsd30d * USD_CLP)
                const price = planPrice(c.plan)
                const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : null
                return (
                  <tr key={c.id} className="border-t border-line align-middle">
                    <td className="p-3"><p className="font-medium">{c.name}</p><p className="text-xs text-muted">desde {date(c.createdAt)}</p></td>
                    <td>
                      <form action={setCompanyPlan} className="flex items-center gap-1">
                        <input type="hidden" name="org" value={c.id} />
                        <select name="plan" defaultValue={c.plan} aria-label={`Plan de ${c.name}`}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs">
                          {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <Button type="submit" size="sm">Guardar</Button>
                      </form>
                    </td>
                    <td>{c.members}</td>
                    <td>{formatNumber(c.products)}</td>
                    <td>{c.knowledge}</td>
                    <td>{formatNumber(c.conversations30d)}</td>
                    <td>{formatNumber(c.aiMessages30d)}</td>
                    <td>{c.ticketsWon30d} · {formatClp(c.revenueWon30d)}</td>
                    <td>{formatClp(cost)}</td>
                    <td>{margin === null ? '—' : <Badge tone={margin >= 50 ? 'success' : 'brand'}>{margin}%</Badge>}</td>
                    <td className="pr-3 text-muted">{date(c.lastActivity)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted">Costo de IA convertido a pesos con US$1 = {formatClp(USD_CLP)}. El panel se cierra solo tras 30 minutos.</p>
    </div>
  )
}
