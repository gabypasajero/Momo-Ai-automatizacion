'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { attempt, fail, ok, text, type ActionState } from '@/lib/actions'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env'
import { ORG_COOKIE, getSession } from '@/lib/session'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface LoginState {
  error: string | null
}

/** Solo rutas internas: evita redirecciones abiertas a otros sitios. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : '/hoy'
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresa tu correo y contraseña.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === 'email_not_confirmed') return { error: 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.' }
    if (error.status === 429) return { error: 'Demasiados intentos. Espera un minuto y vuelve a intentar.' }
    return { error: 'Correo o contraseña incorrectos.' }
  }

  redirect(safeNext(formData.get('next')))
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  ;(await cookies()).delete(ORG_COOKIE)
  redirect('/login')
}

/** Cambia la empresa activa (solo entre las empresas a las que la persona pertenece). */
export async function switchOrg(formData: FormData) {
  const org = String(formData.get('org') ?? '')
  const session = await getSession()
  if (session.memberships.some((m) => m.organization.id === org)) {
    ;(await cookies()).set(ORG_COOKIE, org, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  redirect('/hoy')
}

export interface RecoveryState {
  error: string | null
  sent: boolean
}

/** Envía el correo para crear una nueva contraseña; el enlace vuelve a Momo, no a la tienda. */
export async function requestPasswordReset(_prev: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Ingresa tu correo.', sent: false }

  const h = await headers()
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/restablecer`,
  })
  // Misma respuesta exista o no la cuenta: no revela qué correos están registrados.
  if (error && error.status === 429) return { error: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.', sent: false }
  return { error: null, sent: true }
}

export interface NewPasswordState {
  error: string | null
}

function passwordProblem(password: string, confirm: string) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Usa letras y números.'
  if (password !== confirm) return 'Las contraseñas no coinciden.'
  return null
}

/** Nueva contraseña desde el enlace del correo de recuperación. */
export async function updatePassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const password = String(formData.get('password') ?? '')
  const problem = passwordProblem(password, String(formData.get('confirm') ?? ''))
  if (problem) return { error: problem }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password, data: { debe_cambiar_clave: false } })
  if (error) {
    if (error.code === 'same_password') return { error: 'Usa una contraseña distinta a la anterior.' }
    if (error.code === 'weak_password') return { error: 'Esa contraseña es muy fácil de adivinar. Prueba otra.' }
    return { error: 'El enlace venció. Pide uno nuevo desde “¿Olvidaste tu contraseña?”.' }
  }
  redirect('/hoy')
}

/** Cambio de contraseña con la sesión abierta (Ajustes › Mi perfil): exige la contraseña actual. */
export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await getSession()
    const current = String(formData.get('current') ?? '')
    const password = String(formData.get('password') ?? '')
    const problem = passwordProblem(password, String(formData.get('confirm') ?? ''))
    if (problem) return fail(problem)
    if (password === current) return fail('Usa una contraseña distinta a la actual.')

    // Verifica la contraseña actual con un cliente aparte (no toca las cookies de la sesión).
    const verifier = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { error: wrong } = await verifier.auth.signInWithPassword({ email: session.user.email, password: current })
    if (wrong) return fail(wrong.status === 429 ? 'Demasiados intentos. Espera un minuto.' : 'La contraseña actual no es correcta.')
    await verifier.auth.signOut({ scope: 'local' })

    const { error } = await session.db.auth.updateUser({ password, data: { debe_cambiar_clave: false } })
    if (error) return fail(error.code === 'weak_password' ? 'Esa contraseña es muy fácil de adivinar. Prueba otra.' : 'No se pudo cambiar la contraseña.')
    revalidatePath('/', 'layout')
    return ok('Listo. Tu contraseña quedó cambiada.')
  })
}

/** Nombre con el que te ve el equipo. */
export async function updateMyName(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return attempt(async () => {
    const { callAccounts } = await import('@/lib/accounts')
    const name = text(formData, 'name', 80)
    if (name.length < 2) return fail('Escribe tu nombre.')
    await callAccounts('perfil_nombre', { name })
    revalidatePath('/', 'layout')
    return ok('Nombre actualizado.')
  })
}
