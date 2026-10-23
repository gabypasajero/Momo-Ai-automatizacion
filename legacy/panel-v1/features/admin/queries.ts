import 'server-only'
import { cache } from 'react'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { PlanId } from '@/lib/data/types'

/** Estado del panel del dueño de la plataforma (ver momo.admin_panel_state). */
export type AdminPanelState = 'sin_acceso' | 'sin_clave' | 'bloqueado' | 'cerrado' | 'abierto'

export interface AdminCompanyRow {
  id: string
  name: string
  slug: string
  plan: PlanId
  createdAt: string
  members: number
  products: number
  knowledge: number
  conversations30d: number
  messages30d: number
  aiMessages30d: number
  ticketsWon30d: number
  revenueWon30d: number
  aiCostUsd30d: number
  lastActivity: string | null
}

/** ¿Mostrar el acceso al panel en el menú? Solo administradores de la plataforma. */
export const isPlatformAdmin = cache(async () => {
  if (!isSupabaseConfigured) return false
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('is_platform_admin')
  return data === true
})

export async function getAdminPanelState(): Promise<AdminPanelState> {
  if (!isSupabaseConfigured) return 'sin_acceso'
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc('admin_panel_state')
  return (data as AdminPanelState | null) ?? 'sin_acceso'
}

export async function getAdminOverview(): Promise<AdminCompanyRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('admin_overview')
  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    plan: r.plan as PlanId,
    createdAt: r.created_at as string,
    members: Number(r.members),
    products: Number(r.products),
    knowledge: Number(r.knowledge),
    conversations30d: Number(r.conversations_30d),
    messages30d: Number(r.messages_30d),
    aiMessages30d: Number(r.ai_messages_30d),
    ticketsWon30d: Number(r.tickets_won_30d),
    revenueWon30d: Number(r.revenue_won_30d),
    aiCostUsd30d: Number(r.ai_cost_usd_30d),
    lastActivity: (r.last_activity as string | null) ?? null,
  }))
}
