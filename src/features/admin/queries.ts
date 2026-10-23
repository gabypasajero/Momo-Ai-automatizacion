import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { PlanId } from '@/config/plans'
import { callAccounts } from '@/lib/accounts'
import { isSupabaseConfigured } from '@/lib/env'
import type { MomoClient } from '@/lib/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/** Estado del panel del dueño de la plataforma (ver momo.admin_panel_state). */
export type AdminPanelState = 'sin_acceso' | 'sin_clave' | 'bloqueado' | 'cerrado' | 'abierto'

/** Cliente con la sesión de quien entra al área de administración (no exige pertenecer a una empresa). */
export const getAdminContext = cache(async () => {
  if (!isSupabaseConfigured) return { db: null, state: 'sin_acceso' as AdminPanelState, email: '' }
  const db = (await createSupabaseServerClient()) as unknown as MomoClient
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  const { data } = await db.rpc('admin_panel_state')
  return { db, state: ((data as AdminPanelState | null) ?? 'sin_acceso'), email: user.email ?? '' }
})

async function openDb() {
  const { db, state } = await getAdminContext()
  if (!db || state !== 'abierto') throw new Error('panel cerrado')
  return db
}

export interface CompanyRow {
  id: string
  name: string
  slug: string
  plan: PlanId
  status: 'activa' | 'suspendida'
  created_at: string
  members: number
  owner_user_id: string | null
  products: number
  knowledge: number
  conversations_30d: number
  messages_30d: number
  ai_messages_30d: number
  tickets_won_30d: number
  revenue_won_30d: number
  ai_cost_usd_30d: number
  pending_requests: number
  last_activity: string | null
}

export const listCompanies = cache(async (): Promise<CompanyRow[]> => {
  const db = await openDb()
  const { data, error } = await db.rpc('admin_resumen')
  if (error) throw error
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as CompanyRow),
    members: Number(r.members), products: Number(r.products), knowledge: Number(r.knowledge),
    conversations_30d: Number(r.conversations_30d), messages_30d: Number(r.messages_30d), ai_messages_30d: Number(r.ai_messages_30d),
    tickets_won_30d: Number(r.tickets_won_30d), revenue_won_30d: Number(r.revenue_won_30d),
    ai_cost_usd_30d: Number(r.ai_cost_usd_30d), pending_requests: Number(r.pending_requests),
  }))
})

export interface AccountInfo {
  email: string | null
  last_sign_in_at: string | null
  must_change_password: boolean
}

/** Correos de cuentas (los entrega la función momo-usuarios con el panel abierto). */
export async function accountsById(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => !!id))]
  if (unique.length === 0) return {} as Record<string, AccountInfo>
  const { accounts } = await callAccounts<{ accounts: Record<string, AccountInfo> }>('admin_correos', { user_ids: unique })
  return accounts
}

export interface RequestRow {
  id: string
  organization_id: string
  organization_name: string
  kind: 'plan' | 'canal' | 'soporte'
  detail: string
  message: string | null
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'resuelta'
  created_by: string | null
  created_at: string
  resolved_at: string | null
}

export async function listRequests(status: string | null) {
  const db = await openDb()
  const { data, error } = await db.rpc('admin_list_requests', { p_status: status })
  if (error) throw error
  return (data ?? []) as RequestRow[]
}

export interface UsageRow {
  day: string
  organization_id: string
  organization_name: string
  feature: 'asistente_interno' | 'vendedor'
  calls: number
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cost_usd: number
}

export async function aiUsage(days: number) {
  const db = await openDb()
  const { data, error } = await db.rpc('admin_ai_usage', { days })
  if (error) throw error
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as UsageRow),
    calls: Number(r.calls), input_tokens: Number(r.input_tokens), output_tokens: Number(r.output_tokens),
    cache_read_tokens: Number(r.cache_read_tokens), cost_usd: Number(r.cost_usd),
  }))
}
