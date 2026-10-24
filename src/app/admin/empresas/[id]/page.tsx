import { ArrowLeft, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm, AutoSubmitSelect, Avatar, Badge, Card, CardTitle, ConfirmAction, Input, Select, SubmitButton } from '@/components/ui'
import { PLANS, findPlan } from '@/config/plans'
import { ROLE_LABELS, ROLES } from '@/config/sales'
import { adminAddMember, adminChangeRole, adminRemoveMember, resolveRequest, updateCompanyAdmin } from '@/features/admin/actions'
import { ResetPasswordButton } from '@/features/admin/AdminForms'
import { aiUsage, listCompanies, listRequests } from '@/features/admin/queries'
import { AddMemberButton } from '@/features/ajustes/TeamForms'
import { listTeam } from '@/lib/accounts'
import { formatClp, formatNumber, formatShortDate, timeAgo } from '@/lib/format'

export const metadata: Metadata = { title: 'Empresa' }

const USD_CLP = 950
const KIND = { plan: 'Cambio de plan', canal: 'Conectar canal', soporte: 'Ayuda' } as const

export default async function AdminCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = (await listCompanies()).find((c) => c.id === id)
  if (!company) notFound()
  const [team, usage, requests] = await Promise.all([listTeam(id), aiUsage(30), listRequests(null)])
  const ownUsage = usage.filter((u) => u.organization_id === id)
  const ownRequests = requests.filter((r) => r.organization_id === id).slice(0, 10)
  const plan = findPlan(company.plan)

  return (
    <div className="space-y-6">
      <Link href="/admin/empresas" className="inline-flex min-h-10 items-center gap-2 font-bold text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Empresas</Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[28px] font-bold leading-tight">{company.name}</h1>
        <Badge tone={company.status === 'activa' ? 'success' : 'danger'}>{company.status === 'activa' ? 'Activa' : 'Suspendida'}</Badge>
        <Badge tone="brand">Plan {plan.name}</Badge>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Conversaciones · 30 días', formatNumber(company.conversations_30d)],
          ['Ventas · 30 días', `${company.tickets_won_30d} · ${formatClp(company.revenue_won_30d)}`],
          ['Costo de IA · 30 días', formatClp(company.ai_cost_usd_30d * USD_CLP)],
          ['Catálogo y políticas', `${formatNumber(company.products)} productos · ${company.knowledge} políticas`],
        ].map(([label, value]) => <Card key={label} className="p-5"><p className="text-sm font-bold text-muted">{label}</p><p className="mt-1 text-xl font-extrabold">{value}</p></Card>)}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="flex-1">Equipo</CardTitle>
            <AddMemberButton action={adminAddMember} allowOwner extra={{ org: id }} />
          </div>
          {team.length === 0 ? <p className="text-sm text-muted">La empresa aún no tiene personas. Suma a su dueño.</p> : (
            <ul className="divide-y divide-line">
              {team.map((m) => (
                <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={m.display_name ?? m.email ?? '?'} />
                  <div className="min-w-0 flex-[1_1_200px]">
                    <p className="truncate font-bold">{m.display_name ?? m.email}</p>
                    <p className="truncate text-sm text-muted">{m.email} · {m.last_sign_in_at ? `entró ${timeAgo(m.last_sign_in_at)}` : 'aún no entra'}{m.must_change_password && ' · contraseña temporal'}</p>
                  </div>
                  <ActionForm action={adminChangeRole} className="w-44">
                    <input type="hidden" name="org" value={id} />
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <label className="sr-only" htmlFor={`rol-${m.user_id}`}>Rol</label>
                    <AutoSubmitSelect id={`rol-${m.user_id}`} name="role" defaultValue={m.role}>
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </AutoSubmitSelect>
                  </ActionForm>
                  <ResetPasswordButton userId={m.user_id} label={m.email ?? 'esta persona'} />
                  <ConfirmAction action={adminRemoveMember} fields={{ org: id, user_id: m.user_id }} trigger={<Trash2 className="h-4 w-4" aria-hidden />}
                    triggerLabel={`Quitar a ${m.email}`} triggerVariant="ghost" triggerSize="sm" title="¿Quitar de la empresa?"
                    description={`${m.email} ya no podrá entrar a ${company.name}. Su cuenta sigue existiendo.`} confirmLabel="Quitar" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <CardTitle>Datos y plan</CardTitle>
          <ActionForm action={updateCompanyAdmin} className="space-y-4">
            <input type="hidden" name="org" value={id} />
            <Input label="Nombre" name="name" defaultValue={company.name} required maxLength={120} />
            <Select label="Plan" name="plan" defaultValue={company.plan}>
              {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}{p.priceClp ? ` · ${formatClp(p.priceClp)}` : ''}</option>)}
            </Select>
            <Select label="Estado" name="status" defaultValue={company.status}>
              <option value="activa">Activa</option>
              <option value="suspendida">Suspendida (no puede usar Momo)</option>
            </Select>
            <SubmitButton className="w-full">Guardar</SubmitButton>
          </ActionForm>
          <p className="text-xs text-muted">Identificador: {company.slug} · creada {formatShortDate(company.created_at)}</p>
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <CardTitle>Consumo de IA por día</CardTitle>
          {ownUsage.length === 0 ? <p className="text-sm text-muted">Sin consumo en los últimos 30 días.</p> : (
            <table className="w-full text-sm">
              <caption className="sr-only">Consumo de IA</caption>
              <thead className="text-left text-xs uppercase text-muted"><tr><th scope="col" className="pb-2">Día</th><th scope="col" className="pb-2">Uso</th><th scope="col" className="pb-2 text-right">Llamadas</th><th scope="col" className="pb-2 text-right">Costo</th></tr></thead>
              <tbody className="divide-y divide-line">
                {ownUsage.map((u) => (
                  <tr key={`${u.day}-${u.feature}`}><td className="py-2">{formatShortDate(`${u.day}T12:00:00`)}</td><td className="py-2">{u.feature === 'vendedor' ? 'Momo vendedor' : 'Asistente interno'}</td>
                    <td className="py-2 text-right">{u.calls}</td><td className="py-2 text-right font-bold">{formatClp(u.cost_usd * USD_CLP)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card className="space-y-3 p-5">
          <CardTitle>Solicitudes</CardTitle>
          {ownRequests.length === 0 ? <p className="text-sm text-muted">Esta empresa no ha enviado solicitudes.</p> : (
            <ul className="divide-y divide-line">
              {ownRequests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
                  <span className="min-w-0 flex-1"><strong>{KIND[r.kind]}</strong>: {r.kind === 'plan' ? findPlan(r.detail).name : r.detail}{r.message && <span className="block text-muted">{r.message}</span>}</span>
                  {r.status === 'pendiente' ? (
                    <div className="flex gap-1">
                      {([[r.kind === 'plan' ? 'aprobada' : 'resuelta', r.kind === 'plan' ? 'Aprobar' : 'Resuelta', 'primary'], ['rechazada', 'Rechazar', 'secondary']] as const).map(([decision, label, variant]) => (
                        <ActionForm key={decision} action={resolveRequest}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value={decision} />
                          <SubmitButton size="sm" variant={variant} pendingLabel="…">{label}</SubmitButton>
                        </ActionForm>
                      ))}
                    </div>
                  ) : <Badge tone={r.status === 'rechazada' ? 'danger' : 'success'}>{r.status}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
