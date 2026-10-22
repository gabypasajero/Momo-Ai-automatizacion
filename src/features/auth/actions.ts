'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface LoginState {
  error: string | null
}

/** Solo rutas internas: evita redirecciones abiertas a otros sitios. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/') && !next.startsWith('//') ? next : '/inicio'
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresa tu correo y contraseña.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.code === 'email_not_confirmed') return { error: 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.' }
    return { error: 'Correo o contraseña incorrectos.' }
  }

  redirect(safeNext(formData.get('next')))
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
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
  if (error && error.status === 429) return { error: 'Demasiados intentos. Espera un minuto y vuelve a intentar.', sent: false }
  return { error: null, sent: true }
}

export interface NewPasswordState {
  error: string | null
}

export async function updatePassword(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (error.code === 'same_password') return { error: 'Usa una contraseña distinta a la anterior.' }
    return { error: 'El enlace venció. Pide uno nuevo desde “¿Olvidaste tu contraseña?”.' }
  }
  redirect('/inicio')
}
