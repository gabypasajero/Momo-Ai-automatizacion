import 'server-only'
import { UserError } from '@/lib/actions'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Llama a la función momo-usuarios (Supabase Edge Function con service_role) con la sesión
 * de quien usa la app. La función valida permisos: aquí solo se transporta la petición.
 */
export async function callAccounts<T>(accion: string, body: Record<string, unknown> = {}): Promise<T> {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new UserError('Tu sesión expiró. Vuelve a ingresar.')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/momo-usuarios`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accion, ...body }),
    cache: 'no-store',
  })
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new UserError(payload.error ?? 'No se pudo completar la acción.')
  return payload
}

export interface TeamMember {
  user_id: string
  role: 'owner' | 'admin' | 'agent' | 'viewer'
  display_name: string | null
  created_at: string
  email: string | null
  last_sign_in_at: string | null
  must_change_password: boolean
}

export async function listTeam(orgId: string) {
  const { members } = await callAccounts<{ members: TeamMember[] }>('equipo_listar', { org: orgId })
  return members
}
