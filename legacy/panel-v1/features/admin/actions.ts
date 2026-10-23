'use server'

import { revalidatePath } from 'next/cache'
import { PLANS } from '@/config/plans'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface PanelFormState {
  error: string | null
}

/** Abre el panel por 30 minutos con la contraseña propia del panel (distinta a la de la cuenta). */
export async function unlockPanel(_prev: PanelFormState, formData: FormData): Promise<PanelFormState> {
  const password = String(formData.get('password') ?? '')
  if (!password) return { error: 'Ingresa la contraseña del panel.' }
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('admin_unlock', { password })
  if (error) return { error: 'No se pudo verificar. Intenta de nuevo.' }
  if (data === 'incorrecta') return { error: 'Contraseña incorrecta.' }
  if (data === 'bloqueado') return { error: 'Demasiados intentos. El panel quedó bloqueado 15 minutos.' }
  if (data !== 'abierto') return { error: 'Tu cuenta no tiene acceso a este panel.' }
  revalidatePath('/admin')
  return { error: null }
}

/** Crea la contraseña del panel (primera vez) o la cambia con el panel abierto. */
export async function setPanelPassword(_prev: PanelFormState, formData: FormData): Promise<PanelFormState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < 10) return { error: 'Usa al menos 10 caracteres.' }
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.rpc('admin_set_password', { new_password: password })
  if (error) return { error: 'No se pudo guardar la contraseña.' }
  revalidatePath('/admin')
  return { error: null }
}

export async function lockPanel() {
  const supabase = await createSupabaseServerClient()
  await supabase.rpc('admin_lock')
  revalidatePath('/admin')
}

export async function setCompanyPlan(formData: FormData) {
  const org = String(formData.get('org') ?? '')
  const plan = String(formData.get('plan') ?? '')
  if (!org || !PLANS.some((p) => p.id === plan)) return
  const supabase = await createSupabaseServerClient()
  await supabase.rpc('admin_set_plan', { org, new_plan: plan })
  revalidatePath('/admin')
}
