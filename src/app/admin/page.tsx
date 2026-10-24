import { ArrowRight, Building2, Inbox, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { InstallApp } from '@/components/pwa/InstallApp'
import { Badge, Card, CardTitle } from '@/components/ui'
import { CreateCompanyButton } from '@/features/admin/AdminForms'
import { businessNumbers, growthByMonth } from '@/features/admin/metrics'
import { getAdminContext, listCompanies, listRequests } from '@/features/admin/queries'
import { Bars, Columns, DarkPanel, Stat } from '@/features/admin/ui/ControlParts'
import { firstName, formatClp, formatNumber, formatPercent, formatToday, greeting, timeAgo } from '@/lib/format'

export const metadata: Metadata = { title: 'Inicio' }

/** Portada de Momo Control: cómo va el negocio en una sola pantalla. */
export default async function ControlHome() {
  const [{ email }, companies, pending] = await Promise.all([getAdminContext(), listCompanies(), listRequests('pendiente')])
  const n = businessNumbers(companies)
  const growth = growthByMonth(companies)
  const recent = [...companies].filter((c) => c.last_activity).sort((a, b) => (b.last_activity ?? '').localeCompare(a.last_activity ?? '')).slice(0, 5)
  const momoShare = n.messages ? (n.aiMessages / n.messages) * 100 : null

  return (
    <div className="space-y-5">
      <InstallApp variant="banner" name="Momo Control" everywhere />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-semibold capitalize text-muted">{formatToday()}</p>
          <h1 className="font-display text-[28px] font-bold leading-tight">{greeting()}, {firstName(email)}</h1>
        </div>
        <CreateCompanyButton />
      </header>

      <DarkPanel label="Ganancia del mes">
        <p className="text-sm font-bold uppercase tracking-widest text-[#F4B740]">Ganancia del mes</p>
        <p className="mt-1 font-display text-[44px] font-bold leading-none">{formatClp(n.profit)}</p>
        <p className="mt-2 text-white/75">
          Entran {formatClp(n.income)} por planes y la IA cuesta {formatClp(n.aiCost)}
          {n.margin !== null && <> · te queda el <b className="text-[#F4B740]">{formatPercent(n.margin)}</b></>}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat tone="gold" label="Al año (si sigue así)" value={formatClp(n.yearly)} />
          <Stat tone="dark" label="Empresas activas" value={String(n.active)} hint={n.suspended ? `${n.suspended} suspendida${n.suspended > 1 ? 's' : ''}` : 'Ninguna suspendida'} />
          <Stat tone="dark" label="Paga cada empresa" value={formatClp(n.perCompany)} hint="en promedio" />
          <Stat tone="dark" label="Personas usando Momo" value={formatNumber(n.people)} />
        </div>
        <Link href="/admin/ganancias" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 font-extrabold text-[#2A1420]">Ver ganancias en detalle<ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </DarkPanel>

      {pending.length > 0 && (
        <Link href="/admin/solicitudes" className="flex items-center gap-4 rounded-3xl bg-brand-600 p-4 font-extrabold text-white ring-2 ring-[#F4B740]/60">
          <Inbox className="h-7 w-7 shrink-0" aria-hidden />
          <span className="flex-1">{pending.length === 1 ? 'Tienes 1 solicitud por revisar' : `Tienes ${pending.length} solicitudes por revisar`}</span>
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <CardTitle>Empresas por plan</CardTitle>
          <Bars items={n.byPlan.map((p) => ({ label: p.name, value: p.count, note: p.price ? `· ${formatClp(p.income)}/mes` : '· a medida' }))} format={(v) => String(v)} />
        </Card>
        <Card className="space-y-4 p-5">
          <CardTitle>Crecimiento</CardTitle>
          <Columns label="Empresas nuevas por mes" items={growth.map((g) => ({ label: g.label, value: g.created }))} />
          <p className="text-sm text-muted">Empresas nuevas cada mes · en total {companies.length}</p>
        </Card>
      </div>

      <section aria-label="Actividad de los últimos 30 días" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Conversaciones" value={formatNumber(n.conversations)} hint="últimos 30 días" />
        <Stat label="Respondió Momo" value={momoShare === null ? '—' : formatPercent(momoShare)} hint="de los mensajes" />
        <Stat label="Ventas de tus clientes" value={formatClp(n.clientSales)} hint={`${n.clientSalesCount} ventas cerradas`} />
        <Stat label="Costo IA por chat" value={n.conversations ? formatClp(n.aiCost / n.conversations) : '—'} hint="promedio" />
      </section>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Últimos movimientos</CardTitle>
          <Link href="/admin/empresas" className="text-sm font-extrabold text-brand-700 hover:underline">Ver empresas</Link>
        </div>
        {recent.length === 0 ? <p className="text-sm text-muted">Aún no hay actividad en las empresas.</p> : (
          <ul className="divide-y divide-line">
            {recent.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/empresas/${c.id}`} className="flex min-h-14 items-center gap-3 py-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Building2 className="h-5 w-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{c.name}</span><span className="block text-sm text-muted">{formatNumber(c.conversations_30d)} chats · {timeAgo(c.last_activity)}</span></span>
                  {c.status === 'suspendida' && <Badge tone="danger">Suspendida</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted"><Sparkles className="h-4 w-4" aria-hidden />Los ingresos se calculan con el precio de cada plan. El plan Corporativo (a medida) no suma hasta que le pongas precio.</p>
    </div>
  )
}
