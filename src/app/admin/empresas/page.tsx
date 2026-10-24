import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge, PageTitle } from '@/components/ui'
import { findPlan } from '@/config/plans'
import { CreateCompanyButton } from '@/features/admin/AdminForms'
import { accountsById, listCompanies } from '@/features/admin/queries'
import { formatClp, formatNumber, formatShortDate, timeAgo } from '@/lib/format'

export const metadata: Metadata = { title: 'Empresas' }

const USD_CLP = 950

export default async function AdminCompanies() {
  const companies = await listCompanies()
  const owners = await accountsById(companies.map((c) => c.owner_user_id))
  return (
    <div className="space-y-6">
      <PageTitle title="Empresas" description={`${companies.length} ${companies.length === 1 ? 'empresa' : 'empresas'} en la plataforma`} actions={<CreateCompanyButton />} />
      <ul className="space-y-3 md:hidden">
        {companies.map((c) => {
          const price = findPlan(c.plan).priceClp ?? 0
          const cost = c.ai_cost_usd_30d * USD_CLP
          return (
            <li key={c.id}>
              <Link href={`/admin/empresas/${c.id}`} className="block rounded-3xl border border-line bg-white p-4 active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold text-brand-700">{c.name}</p>
                    <p className="text-sm text-muted">{findPlan(c.plan).name} · {c.members} {c.members === 1 ? 'persona' : 'personas'}</p>
                  </div>
                  {c.status === 'suspendida' ? <Badge tone="danger">Suspendida</Badge> : <Badge tone="success">Activa</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-2xl bg-surface p-2"><p className="text-xs text-muted">Paga</p><p className="font-extrabold">{formatClp(price)}</p></div>
                  <div className="rounded-2xl bg-surface p-2"><p className="text-xs text-muted">IA</p><p className="font-extrabold">{formatClp(cost)}</p></div>
                  <div className="rounded-2xl bg-surface p-2"><p className="text-xs text-muted">Chats</p><p className="font-extrabold">{formatNumber(c.conversations_30d)}</p></div>
                </div>
                <p className="mt-2 text-xs text-muted">{c.last_activity ? `Última actividad ${timeAgo(c.last_activity)}` : 'Sin mensajes aún'}{c.pending_requests > 0 && ` · ${c.pending_requests} solicitud${c.pending_requests > 1 ? 'es' : ''}`}</p>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="relative hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
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
