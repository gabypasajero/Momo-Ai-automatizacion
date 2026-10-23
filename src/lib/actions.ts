import 'server-only'
import type { ActionState } from '@/components/ui/ActionForm'
import type { Role } from '@/config/sales'
import { getSession, type Session } from '@/lib/session'

/** Resultado de una server action usada con useActionState (formularios con mensaje). */
export type { ActionState }

export const ok = (message: string | null = null, data?: ActionState['data']): ActionState => ({ ok: true, message, error: null, data })
export const fail = (error: string): ActionState => ({ ok: false, message: null, error })

/** Error con un mensaje apto para mostrar a la persona. */
export class UserError extends Error {}

/** Sesión con el rol mínimo exigido; si no alcanza lanza un UserError con un mensaje claro. */
export async function requireRole(roles: Role[]): Promise<Session> {
  const session = await getSession()
  if (!roles.includes(session.role)) throw new UserError('Tu rol no permite hacer esto. Pídeselo al dueño de la empresa.')
  if (session.org.status === 'suspendida') throw new UserError('La cuenta de la empresa está suspendida. Escríbenos para reactivarla.')
  return session
}

export const EDITORS: Role[] = ['owner', 'admin', 'agent']
export const MANAGERS: Role[] = ['owner', 'admin']

type PgLikeError = { code?: string; message?: string }

/** Traduce errores de Postgres/Supabase a mensajes en español. */
export function describeError(error: unknown): string {
  if (error instanceof UserError) return error.message
  const e = error as PgLikeError
  switch (e?.code) {
    case '42501': return 'No tienes permiso para hacer esto.'
    case '23505': return 'Ya existe un registro con esos datos.'
    case '23503': return 'Ese dato está en uso o ya no existe.'
    case '23514': case '22023': case '22P02': return 'Revisa los datos ingresados.'
    case 'PGRST116': return 'No encontramos ese registro.'
  }
  console.error('acción fallida', error)
  return 'No se pudo guardar. Intenta nuevamente.'
}

/** Ejecuta una acción de formulario y convierte cualquier error en un ActionState. */
export async function attempt(run: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await run()
  } catch (error) {
    // redirect() y notFound() se propagan: Next los usa para navegar.
    if (error instanceof Error && 'digest' in error && String((error as { digest?: string }).digest).startsWith('NEXT_')) throw error
    return fail(describeError(error))
  }
}

// ---------------------------------------------------------------------------
// Lectura de FormData
// ---------------------------------------------------------------------------

export function text(form: FormData, name: string, max = 2000): string {
  return String(form.get(name) ?? '').trim().slice(0, max)
}

export function optionalText(form: FormData, name: string, max = 2000): string | null {
  const value = text(form, name, max)
  return value === '' ? null : value
}

/** Entero ≥ 0 a partir de textos como "189.990" o "$ 15.000". */
export function money(form: FormData, name: string): number {
  const digits = String(form.get(name) ?? '').replace(/\D/g, '')
  return digits === '' ? 0 : Math.min(Number(digits), 2_000_000_000)
}

export function optionalMoney(form: FormData, name: string): number | null {
  const digits = String(form.get(name) ?? '').replace(/\D/g, '')
  return digits === '' ? null : Math.min(Number(digits), 2_000_000_000)
}

export function uuid(form: FormData, name: string): string {
  const value = String(form.get(name) ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(value)) throw new UserError('Falta un dato para completar la acción. Recarga la página.')
  return value
}

export function optionalUuid(form: FormData, name: string): string | null {
  const value = String(form.get(name) ?? '')
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null
}

export const checked = (form: FormData, name: string) => form.get(name) === 'on' || form.get(name) === 'true'

/** Texto para búsquedas ilike: sin comodines ni separadores de filtros. */
export function searchTerm(value: string | undefined | null) {
  return (value ?? '').trim().slice(0, 80).replace(/[%_,()\\]/g, ' ').replace(/\s+/g, ' ').trim()
}
