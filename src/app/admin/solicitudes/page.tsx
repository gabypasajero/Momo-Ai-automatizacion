import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm, Badge, EmptyState, PageTitle, SubmitButton, Tabs } from '@/components/ui'
import { findPlan } from '@/config/plans'
import { CHANNELS, isChannel } from '@/config/sales'
import { resolveRequest } from '@/features/admin/actions'
import { accountsById, listRequests, type RequestRow } from '@/features/admin/queries'
import { formatDateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Solicitudes' }

const KIND = { plan: 'Cambio de plan', canal: 'Conectar canal', soporte: 'Ayuda' } as const
const STATUS_TONE = { pendiente: 'brand', aprobada: 'success', resuelta: 'success', rechazada: 'danger' } as const

/** Un formulario por decisión: cada botón envía su propia decisión. */
function Decision({ id, kind }: { id: string; kind: RequestRow['kind'] }) {
  const options = kind === 'plan'
    ? [['aprobada', 'Aprobar y cambiar plan', 'primary'], ['rechazada', 'Rechazar', 'secondary']] as const
    : [['resuelta', 'Marcar resuelta', 'primary'], ['rechazada', 'Rechazar', 'secondary']] as const
  return (
    <div className="flex flex-wrap items-start gap-2">
      {options.map(([decision, label, variant]) => (
        <ActionForm key={decision} action={resolveRequest}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value={decision} />
          <SubmitButton variant={variant} pendingLabel="Guardando…">{label}</SubmitButton>
        </ActionForm>
      ))}
    </div>
  )
}

export default async function SolicitudesPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams
  const all = f === 'todas'
  const requests = await listRequests(all ? null : 'pendiente')
  const people = await accountsById(requests.map((r) => r.created_by))

  return (
    <div className="space-y-5">
      <PageTitle title="Solicitudes" description="Lo que piden las empresas: cambios de plan, conexión de canales y ayuda." />
      <Tabs label="Filtrar solicitudes" active={all ? 'todas' : 'pendientes'} items={[
        { id: 'pendientes', label: 'Pendientes', href: '/admin/solicitudes' },
        { id: 'todas', label: 'Todas', href: '/admin/solicitudes?f=todas' },
      ]} />
      {requests.length === 0 ? (
        <EmptyState title="Sin solicitudes pendientes" description="Cuando una empresa pida un cambio de plan, un canal o ayuda, aparecerá aquí." />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-white p-5">
              <div className="min-w-0 flex-[1_1_320px]">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/empresas/${r.organization_id}`} className="font-extrabold text-brand-700 hover:underline">{r.organization_name}</Link>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </div>
                <p className="mt-1"><strong>{KIND[r.kind]}:</strong> {r.kind === 'plan' ? `plan ${findPlan(r.detail).name}` : r.kind === 'canal' && isChannel(r.detail) ? CHANNELS[r.detail].label : r.detail}</p>
                {r.message && <p className="mt-1 whitespace-pre-line text-sm text-muted">“{r.message}”</p>}
                <p className="mt-1 text-xs text-muted">{(r.created_by && people[r.created_by]?.email) || 'Persona eliminada'} · {formatDateTime(r.created_at)}{r.resolved_at && ` · respondida ${formatDateTime(r.resolved_at)}`}</p>
              </div>
              {r.status === 'pendiente' && <Decision id={r.id} kind={r.kind} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
