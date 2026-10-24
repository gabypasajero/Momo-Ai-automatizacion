import { PushToggle } from '@/features/avisos/PushToggle'
import { cookies } from 'next/headers'
import { TextSize } from '@/components/prefs/TextSize'
import { Check, Download, Puzzle, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { ActionForm, AutoSubmitSelect, Avatar, Badge, CancelButton, Card, CardTitle, ConfirmAction, Input, Modal, PageTitle, PasswordInput, SubmitButton, Tabs, TextArea, buttonClass } from '@/components/ui'
import { PLANS, SETUP_FEE_CLP, findPlan } from '@/config/plans'
import { CHANNELS, ROLE_LABELS, ROLES } from '@/config/sales'
import { addTeamMember, changeTeamRole, removeTeamMember, sendRequest, updateCompany } from '@/features/ajustes/actions'
import { HandoffEditor } from '@/features/ajustes/HandoffEditor'
import { AddMemberButton } from '@/features/ajustes/TeamForms'
import { changePassword, updateMyName } from '@/features/auth/actions'
import { listTeam } from '@/lib/accounts'
import { cn } from '@/lib/cn'
import { isAiConfigured } from '@/lib/env'
import { formatClp, formatShortDate, timeAgo } from '@/lib/format'
import { canManage, getSession, type Session } from '@/lib/session'

export const metadata: Metadata = { title: 'Ajustes' }

type Tab = 'perfil' | 'empresa' | 'equipo' | 'plan' | 'canales'

async function pendingRequests(session: Session) {
  const { data } = await session.db.from('requests').select('kind, detail, created_at').eq('organization_id', session.org.id).eq('status', 'pendiente')
  return data ?? []
}

function RequestButton({ kind, detail, label, title, description, variant = 'secondary' }: { kind: string; detail: string; label: string; title: string; description: string; variant?: 'primary' | 'secondary' }) {
  return (
    <Modal trigger={label} triggerVariant={variant} triggerSize="sm" title={title} description={description}>
      <ActionForm action={sendRequest} closeOnSuccess className="space-y-4">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="detail" value={detail} />
        <TextArea label="Comentario" hint="opcional" name="message" rows={3} maxLength={1000} placeholder="Cuéntanos lo que necesitas" />
        <div className="flex justify-end gap-2"><CancelButton /><SubmitButton>Enviar solicitud</SubmitButton></div>
      </ActionForm>
    </Modal>
  )
}

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const big = (await cookies()).get('momo_letra')?.value === 'grande'
  const params = await searchParams
  const session = await getSession()
  const manager = canManage(session.role)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'perfil', label: 'Mi perfil' },
    ...(manager ? [{ id: 'empresa' as Tab, label: 'Empresa' }] : []),
    { id: 'equipo', label: 'Equipo' },
    { id: 'plan', label: 'Plan' },
    { id: 'canales', label: 'Canales' },
  ]
  const tab: Tab = tabs.some((t) => t.id === params.t) ? (params.t as Tab) : 'perfil'

  let content: React.ReactNode
  if (tab === 'perfil') {
    content = (
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <CardTitle>Mis datos</CardTitle>
          <ActionForm action={updateMyName} className="space-y-4">
            <Input label="Nombre" hint="así te ve el equipo" name="name" defaultValue={session.user.name} required maxLength={80} />
            <Input label="Correo" name="email_view" defaultValue={session.user.email} disabled />
            <p className="text-sm text-muted">Rol en {session.org.name}: <strong className="text-ink">{ROLE_LABELS[session.role]}</strong></p>
            <SubmitButton>Guardar nombre</SubmitButton>
          </ActionForm>
          <TextSize initial={big} />
          <PushToggle />
        </Card>
        <Card id="contrasena" className="scroll-mt-6 space-y-4 p-5">
          <CardTitle>Cambiar contraseña</CardTitle>
          {session.user.mustChangePassword && <p className="rounded-2xl bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent-strong">Estás usando una contraseña temporal: cámbiala ahora.</p>}
          <ActionForm action={changePassword} resetOnSuccess className="space-y-4">
            <PasswordInput name="current" label="Contraseña actual" autoComplete="current-password" />
            <PasswordInput name="password" label="Nueva contraseña (mínimo 8, con letras y números)" autoComplete="new-password" minLength={8} />
            <PasswordInput name="confirm" label="Repite la nueva contraseña" autoComplete="new-password" minLength={8} />
            <SubmitButton>Cambiar contraseña</SubmitButton>
          </ActionForm>
          {['detodito-outlet', 'muebles-hogar-molina'].includes(session.org.slug) && (
            <p className="text-xs text-muted">Tu cuenta es la misma de la tienda DTO: la nueva contraseña también sirve allá.</p>
          )}
        </Card>
      </div>
    )
  } else if (tab === 'empresa') {
    content = (
      <Card className="max-w-2xl space-y-4 p-5">
        <CardTitle>Datos de la empresa</CardTitle>
        <ActionForm action={updateCompany} className="space-y-5">
          <Input label="Nombre" name="name" defaultValue={session.org.name} required maxLength={120} />
          <HandoffEditor initial={session.org.handoffContacts} />
          <SubmitButton>Guardar</SubmitButton>
        </ActionForm>
      </Card>
    )
  } else if (tab === 'equipo') {
    const team = await listTeam(session.org.id)
    const plan = findPlan(session.org.plan)
    const isOwner = session.role === 'owner'
    content = (
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle>Equipo de {session.org.name}</CardTitle>
            <p className="text-sm text-muted">{team.length}{plan.limits.users ? ` de ${plan.limits.users}` : ''} personas · plan {plan.name}</p>
          </div>
          {manager && <AddMemberButton action={addTeamMember} allowOwner={isOwner} />}
        </div>
        <ul className="divide-y divide-line">
          {team.map((m) => {
            const me = m.user_id === session.user.id
            const canTouch = manager && !me && (isOwner || m.role !== 'owner')
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={m.display_name ?? m.email ?? '?'} />
                <div className="min-w-0 flex-[1_1_200px]">
                  <p className="truncate font-bold">{m.display_name ?? m.email}{me && <span className="font-semibold text-muted"> (tú)</span>}</p>
                  <p className="truncate text-sm text-muted">{m.email} · {m.last_sign_in_at ? `entró ${timeAgo(m.last_sign_in_at)}` : 'aún no entra'}{m.must_change_password && ' · contraseña temporal'}</p>
                </div>
                {canTouch ? (
                  <div className="flex items-center gap-2">
                    <ActionForm action={changeTeamRole} className="w-44">
                      <input type="hidden" name="user_id" value={m.user_id} />
                      <label className="sr-only" htmlFor={`rol-${m.user_id}`}>Rol de {m.display_name ?? m.email}</label>
                      <AutoSubmitSelect id={`rol-${m.user_id}`} name="role" defaultValue={m.role}>
                        {ROLES.filter((r) => isOwner || r !== 'owner').map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </AutoSubmitSelect>
                    </ActionForm>
                    <ConfirmAction action={removeTeamMember} fields={{ user_id: m.user_id }} trigger={<Trash2 className="h-4 w-4" aria-hidden />}
                      triggerLabel={`Quitar a ${m.display_name ?? m.email}`} triggerVariant="ghost" triggerSize="sm"
                      title="¿Quitar del equipo?" description={`${m.display_name ?? m.email} ya no podrá entrar a ${session.org.name}. Su cuenta sigue existiendo.`} confirmLabel="Quitar" />
                  </div>
                ) : <Badge tone={m.role === 'owner' ? 'brand' : 'neutral'}>{ROLE_LABELS[m.role]}</Badge>}
              </li>
            )
          })}
        </ul>
        {!manager && <p className="text-sm text-muted">Solo el dueño o un administrador puede sumar o quitar personas.</p>}
      </Card>
    )
  } else if (tab === 'plan') {
    const plan = findPlan(session.org.plan)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const [conversations, members, pending] = await Promise.all([
      session.db.from('conversations').select('id', { count: 'exact', head: true }).eq('organization_id', session.org.id).gte('created_at', monthStart.toISOString()),
      session.db.from('members').select('user_id', { count: 'exact', head: true }).eq('organization_id', session.org.id),
      pendingRequests(session),
    ])
    const used = conversations.count ?? 0
    const limit = plan.limits.aiConversations
    const pendingPlan = pending.find((r) => r.kind === 'plan')
    content = (
      <div className="space-y-5">
        <Card className="grid gap-4 p-5 md:grid-cols-3">
          <div><p className="text-sm font-bold text-muted">Plan actual</p><p className="font-display text-2xl font-bold">{plan.name}</p><p className="text-sm text-muted">{plan.priceClp ? `${formatClp(plan.priceClp)} + IVA al mes` : 'Precio a medida'}</p></div>
          <div>
            <p className="text-sm font-bold text-muted">Conversaciones este mes</p>
            <p className="text-2xl font-extrabold">{used}{limit ? ` de ${limit.toLocaleString('es-CL')}` : ''}</p>
            {limit && <div className="mt-2 h-2.5 rounded-full bg-brand-50" aria-hidden><div className="h-2.5 rounded-full bg-brand-600" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} /></div>}
          </div>
          <div><p className="text-sm font-bold text-muted">Usuarios</p><p className="text-2xl font-extrabold">{members.count ?? 0}{plan.limits.users ? ` de ${plan.limits.users}` : ''}</p></div>
        </Card>
        <div className={cn('rounded-3xl p-4 text-sm', isAiConfigured() ? 'bg-success-soft text-success' : 'bg-accent-soft text-accent-strong')}>
          {isAiConfigured()
            ? <><strong>Inteligencia de Momo activa.</strong> Las sugerencias y “Probar a Momo” están funcionando.</>
            : <><strong>Inteligencia de Momo pendiente.</strong> Para activar las sugerencias, el dueño de la plataforma debe agregar la clave de Claude (ANTHROPIC_API_KEY) o de Gemini (GEMINI_API_KEY) en Vercel como variable Sensitive y volver a publicar.</>}
        </div>
        {pendingPlan && <p className="rounded-3xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Pediste cambiar al plan {findPlan(pendingPlan.detail).name} el {formatShortDate(pendingPlan.created_at)}. Te contactaremos pronto.</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => {
            const current = p.id === plan.id
            return (
              <Card key={p.id} className={cn('flex flex-col gap-3 p-5', current && 'border-2 border-brand-600', p.highlighted && !current && 'border-brand-200')}>
                <div className="flex items-center justify-between gap-2"><h2 className="font-display text-xl font-bold">{p.name}</h2>{current && <Badge tone="brand">Tu plan</Badge>}</div>
                <p className="text-sm text-muted">{p.description}</p>
                <p className="text-2xl font-extrabold">{p.priceClp ? formatClp(p.priceClp) : 'A medida'}<span className="text-sm font-semibold text-muted">{p.priceClp ? ' + IVA/mes' : ''}</span></p>
                <ul className="flex-1 space-y-1.5 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />{f}</li>)}</ul>
                {!current && manager && (
                  <RequestButton kind="plan" detail={p.id} label={p.priceClp && plan.priceClp && p.priceClp < plan.priceClp ? 'Pedir este plan' : 'Mejorar a este plan'}
                    variant={p.highlighted ? 'primary' : 'secondary'} title={`Cambiar al plan ${p.name}`}
                    description="Revisaremos tu solicitud y te contactaremos para confirmar el cambio y la facturación." />
                )}
              </Card>
            )
          })}
        </div>
        <p className="text-sm text-muted">Implementación inicial (configuración, catálogo y entrenamiento de Momo): {formatClp(SETUP_FEE_CLP)} + IVA, una vez.</p>
      </div>
    )
  } else {
    const [{ data: accounts }, pending] = await Promise.all([
      session.db.from('channel_accounts').select('type, name, status').eq('organization_id', session.org.id),
      pendingRequests(session),
    ])
    const LIST = [
      { id: 'messenger', title: 'Página de Facebook (Messenger)', description: 'Momo responde solo los mensajes de tu Página. Requiere una Página de Facebook y la app de Meta.' },
      { id: 'whatsapp', title: 'WhatsApp Business', description: 'Respuesta automática las 24 horas con la API oficial de WhatsApp.' },
      { id: 'instagram', title: 'Instagram', description: 'Mensajes directos de tu cuenta profesional.' },
      { id: 'tiktok', title: 'TikTok', description: 'Mensajes de tu cuenta de empresa (planes Empresa y Corporativo).' },
    ] as const
    content = (
      <div className="space-y-4">
        <Card className="flex flex-wrap items-start gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1877F2]/10 text-[#1877F2]"><Puzzle className="h-6 w-6" aria-hidden /></span>
          <div className="min-w-0 flex-[1_1_320px] space-y-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold">Marketplace (copiloto)</h2><Badge tone="success">Activo</Badge></div>
            <p className="text-sm text-muted">Facebook no permite conectar los chats de Marketplace de un perfil personal. Por eso Momo trabaja como copiloto: registras el chat, Momo sugiere la respuesta y la pegas en Marketplace. Con la extensión de Chrome tienes tus conversaciones a un clic.</p>
            <ol className="list-decimal pl-5 text-sm text-muted">
              <li>Descarga la extensión y descomprímela.</li>
              <li>En Chrome abre <strong className="text-ink">chrome://extensions</strong>, activa “Modo desarrollador” y elige “Cargar descomprimida”.</li>
              <li>Selecciona la carpeta e inicia sesión con tu correo de Momo.</li>
            </ol>
          </div>
          <a href="/momo-extension.zip" download className={buttonClass('primary')}><Download className="h-4 w-4" aria-hidden />Descargar extensión</a>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {LIST.map((c) => {
            const account = accounts?.find((a) => a.type === c.id)
            const requested = pending.some((r) => r.kind === 'canal' && r.detail === c.id)
            return (
              <Card key={c.id} className="flex flex-col gap-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('h-3 w-3 rounded-full', CHANNELS[c.id].dot)} aria-hidden />
                  <h2 className="font-display text-lg font-bold">{c.title}</h2>
                  <Badge tone={account?.status === 'active' ? 'success' : requested ? 'brand' : 'neutral'}>
                    {account?.status === 'active' ? 'Conectado' : requested ? 'Solicitado' : 'Sin conectar'}
                  </Badge>
                </div>
                <p className="flex-1 text-sm text-muted">{c.description}</p>
                {!account && !requested && manager && (
                  <div><RequestButton kind="canal" detail={c.id} label="Solicitar conexión" title={`Conectar ${c.title}`}
                    description="Te ayudamos a conectarlo: revisaremos los requisitos y te escribiremos con los pasos." /></div>
                )}
              </Card>
            )
          })}
        </div>
        {manager && (
          <Card className="flex flex-wrap items-center gap-3 p-5">
            <p className="min-w-0 flex-1 text-sm text-muted">¿Necesitas ayuda con algo más? Escríbenos y te respondemos.</p>
            <RequestButton kind="soporte" detail="Ayuda" label="Pedir ayuda" title="Pedir ayuda a Momo AI" description="Cuéntanos qué necesitas y te contactaremos." />
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Ajustes" description={session.org.name} />
      <Tabs label="Ajustes" active={tab} items={tabs.map((t) => ({ id: t.id, label: t.label, href: `/ajustes?t=${t.id}` }))} />
      {content}
    </div>
  )
}
