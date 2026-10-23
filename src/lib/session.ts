import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { PlanId } from '@/config/plans'
import type { Role } from '@/config/sales'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Sin tipos generados del esquema: las filas se tipan a mano al leerlas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MomoClient = SupabaseClient<any, 'momo', 'momo'>

/** Cookie con la empresa activa de quien pertenece a varias. */
export const ORG_COOKIE = 'momo_empresa'

export interface HandoffContact {
  label: string
  phone: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan: PlanId
  status: 'activa' | 'suspendida'
  handoffContacts: HandoffContact[]
}

export interface Membership {
  role: Role
  displayName: string | null
  organization: Organization
}

export interface Session {
  db: MomoClient
  user: { id: string; email: string; name: string; mustChangePassword: boolean }
  org: Organization
  role: Role
  memberships: Membership[]
}

export class NoOrganizationError extends Error {
  constructor() {
    super('La cuenta no pertenece a ninguna empresa en Momo.')
  }
}

export class NotConfiguredError extends Error {
  constructor() {
    super('Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.')
  }
}

const PRIORITY: Record<Role, number> = { owner: 0, admin: 1, agent: 2, viewer: 3 }

type OrgRow = { id: string; name: string; slug: string; plan: PlanId; status: 'activa' | 'suspendida'; handoff_contacts: unknown }

export function toOrganization(row: OrgRow): Organization {
  const contacts = Array.isArray(row.handoff_contacts) ? row.handoff_contacts : []
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    status: row.status,
    handoffContacts: contacts
      .filter((c): c is HandoffContact => typeof c?.label === 'string' && typeof c?.phone === 'string')
      .map((c) => ({ label: c.label, phone: c.phone })),
  }
}

/**
 * Sesión de la request: usuario, empresa activa y su rol. Una sola consulta por request (cache).
 * Sin sesión envía al login; sin empresa lanza NoOrganizationError.
 */
export const getSession = cache(async (): Promise<Session> => {
  const cookieStore = await cookies()
  if (!isSupabaseConfigured) throw new NotConfiguredError()
  const db = (await createSupabaseServerClient()) as unknown as MomoClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await db
    .from('members')
    .select('role, display_name, created_at, organization:organizations(id, name, slug, plan, status, handoff_contacts)')
    .eq('user_id', user.id)
  if (error) throw error

  const memberships: Membership[] = (data ?? [])
    .filter((m) => m.organization)
    .sort((a, b) => PRIORITY[a.role as Role] - PRIORITY[b.role as Role] || a.created_at.localeCompare(b.created_at))
    .map((m) => ({
      role: m.role as Role,
      displayName: m.display_name,
      organization: toOrganization(m.organization as unknown as OrgRow),
    }))
  if (memberships.length === 0) throw new NoOrganizationError()

  const preferred = cookieStore.get(ORG_COOKIE)?.value
  const active = memberships.find((m) => m.organization.id === preferred) ?? memberships[0]!
  const meta = user.user_metadata ?? {}

  return {
    db,
    user: {
      id: user.id,
      email: user.email ?? '',
      name: active.displayName || (typeof meta.full_name === 'string' ? meta.full_name : '') || user.email || '',
      mustChangePassword: meta.debe_cambiar_clave === true,
    },
    org: active.organization,
    role: active.role,
    memberships,
  }
})

/** Puede crear y editar (todos menos solo lectura). */
export const canEdit = (role: Role) => role !== 'viewer'
/** Puede administrar la empresa: equipo, plan, personalidad de Momo, borrar datos. */
export const canManage = (role: Role) => role === 'owner' || role === 'admin'

/** ¿Es administrador de la plataforma? (muestra el acceso al área de administración) */
export const isPlatformAdmin = cache(async () => {
  const { db } = await getSession()
  const { data } = await db.rpc('is_platform_admin')
  return data === true
})
