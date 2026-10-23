import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, Card, PageTitle } from '@/components/ui'
import { findPlan } from '@/config/plans'
import { CreateCompanyButton } from '@/features/admin/AdminForms'
import { accountsById, listCompanies } from '@/features/admin/queries'
import { formatClp, formatNumber, formatShortDate, timeAgo } from '@/lib/format'

export const metadata: Metadata = { title: 'Empresas' }

const USD_CLP = 950

export default async function AdminHome() {
  const companies = await listCompanies()
  const owners = await accountsById(companies.map((c) => c.owner_user_id))
  const active = companies.filter((c) => c.status === 'activa')
  const mrr = active.reduce((s, c) => s + (findPlan(c.plan).priceClp ?? 0), 0)
  const aiCost = companies.reduce((s, c) => s + c.ai_cost_usd_30d, 0) * USD_CLP
  const sales = companies.reduce((s, c) => s + c.revenue_won_30d, 0)
  const conversations = companies.reduce((s, c) => s + c.conversations_30d, 0)

  const kpis = [
    { label: 'Ingreso mensual (planes)', value: formatClp(mrr), hint: `${active.length} empresas activas` },
    { label: 'Costo de IA · 30 días', value: formatClp(aiCost), hint: mrr ? `Margen ${Math.round(((mrr - aiCost) / mrr) * 100)}%` : 'Sin ingresos aún' },
    { label: 'Conversaciones · 30 días', value: formatNumber(conversations), hint: 'De todas las empresas' },
    { label: 'Ventas de clientes · 30 días', value: formatClp(sales), hint: 'Lo que Momo ayudó a vender' },
  ]

  return (
    <div className="space-y-6">
      <PageTitle title="Empresas" description="Todas las empresas de la plataforma" actions={<CreateCompanyButton />} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5"><p className="text-sm font-bold text-muted">{k.label}</p><p className="mt-1 text-2xl font-extrabold">{k.value}</p><p className="text-xs text-muted">{k.hint}</p></Card>
        ))}
      </div>
      <div className="relative overflow-x-auto rounded-3xl border border-line bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <caption className="sr-only">Empresas</caption>
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="p-3">Empresa</th><th scope="col" className="p-3">Plan</th><th scope="col" className="p-3">Dueño</th>
              <th scope="col" className="p-3 text-right">Conversaciones</th><th scope="col" className="p-3 text-right">Ventas</th>
              <th scope="col" className="p-3 text-right">Costo IA</th><th scope="col" className="p-3 text-right">Margen</th><th scope="col" className="p-3">Actividad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {companies.map((c) => {
              const price = findPlan(c.plan).priceClp ?? 0
              const cost = c.ai_cost_usd_30d * USD_CLP
              const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : null
              return (
                <tr key={c.id} className="hover:bg-brand-50/40">
                  <td className="p-3">
                    <Link href={`/admin/empresas/${c.id}`} className="font-extrabold text-brand-700 hover:underline">{c.name}</Link>
                    <p className="text-xs text-muted">{c.members} {c.members === 1 ? 'persona' : 'personas'} · desde {formatShortDate(c.created_at)}</p>
                    <div className="mt-1 flex gap-1">
                      {c.status === 'suspendida' && <Badge tone="danger">Suspendida</Badge>}
                      {c.pending_requests > 0 && <Badge tone="brand">{c.pending_requests} solicitud{c.pending_requests > 1 ? 'es' : ''}</Badge>}
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{findPlan(c.plan).name}</td>
                  <td className="p-3 text-muted">{(c.owner_user_id && owners[c.owner_user_id]?.email) || '—'}</td>
                  <td className="p-3 text-right">{formatNumber(c.conversations_30d)}<p className="text-xs text-muted">{formatNumber(c.ai_messages_30d)} de Momo</p></td>
                  <td className="p-3 text-right">{c.tickets_won_30d}<p className="text-xs text-muted">{formatClp(c.revenue_won_30d)}</p></td>
                  <td className="p-3 text-right">{formatClp(cost)}</td>
                  <td className="p-3 text-right">{margin === null ? '—' : <Badge tone={margin >= 50 ? 'success' : 'danger'}>{margin}%</Badge>}</td>
                  <td className="p-3 text-muted">{c.last_activity ? timeAgo(c.last_activity) : 'Sin mensajes'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Costos de IA en pesos con US$1 = {formatClp(USD_CLP)}. Datos de los últimos 30 días.</p>
    </div>
  )
}
