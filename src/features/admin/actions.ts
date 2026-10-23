'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isPlanId } from '@/config/plans'
import { isRole } from '@/config/sales'
import { callAccounts } from '@/lib/accounts'
import { attempt, fail, ok, text, uuid, type ActionState } from '@/lib/actions'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const db = async () => (await createSupabaseServerClient()).schema('momo')

/** Abre el panel por 30 minutos con la contraseña propia del panel (distinta a la de la cuenta). */
export async function unlockPanel(_prev: ActionState, form: FormData): Promise<ActionState> {
  const password = String(form.get('password') ?? '')
  if (!password) return fail('Ingresa la contraseña del panel.')
  const { data, error } = await (await db()).rpc('admin_unlock', { password })
  if (error) return fail('No se pudo verificar. Intenta de nuevo.')
  if (data === 'incorrecta') return fail('Contraseña incorrecta.')
  if (data === 'bloqueado') return fail('Demasiados intentos. El panel quedó bloqueado 15 minutos.')
  if (data !== 'abierto') return fail('Tu cuenta no tiene acceso a este panel.')
  revalidatePath('/admin', 'layout')
  return ok()
}

/** Crea la contraseña del panel la primera vez. */
export async function createPanelPassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const password = String(form.get('password') ?? '')
  if (password.length < 10) return fail('Usa al menos 10 caracteres.')
  if (password !== String(form.get('confirm') ?? '')) return fail('Las contraseñas no coinciden.')
  const { error } = await (await db()).rpc('admin_set_password', { new_password: password })
  if (error) return fail('No se pudo guardar la contraseña.')
  revalidatePath('/admin', 'layout')
  return ok()
}

export async function changePanelPassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  const current = String(form.get('current') ?? '')
  const password = String(form.get('password') ?? '')
  if (password !== String(form.get('confirm') ?? '')) return fail('Las contraseñas nuevas no coinciden.')
  const { data, error } = await (await db()).rpc('admin_change_password', { current_password: current, new_password: password })
  if (error) return fail('El panel se cerró. Vuelve a entrar.')
  if (data === 'incorrecta') return fail('La contraseña actual del panel no es correcta.')
  if (data === 'corta') return fail('Usa al menos 10 caracteres.')
  return ok('Contraseña del panel cambiada.')
}

export async function lockPanel() {
  await (await db()).rpc('admin_lock')
  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

/** Nueva empresa con su dueño: si el correo no tiene cuenta se crea con contraseña temporal. */
export async function createCompany(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const name = text(form, 'name', 120)
    const plan = text(form, 'plan', 20)
    if (!isPlanId(plan)) return fail('Elige un plan.')
    const ownerName = text(form, 'owner_name', 80)
    const ownerEmail = text(form, 'owner_email', 160)
    if (ownerName.length < 2 || !ownerEmail.includes('@')) return fail('Escribe el nombre y el correo del dueño.')
    const { data: orgId, error } = await (await db()).rpc('admin_create_org', { p_name: name, p_plan: plan })
    if (error) return fail(error.message.includes('nombre') ? 'Escribe el nombre de la empresa.' : 'No se pudo crear la empresa (¿el panel sigue abierto?).')
    const result = await callAccounts<{ created: boolean; password: string | null; email: string }>('equipo_agregar', {
      org: orgId, email: ownerEmail, name: ownerName, role: 'owner',
    })
    revalidatePath('/admin', 'layout')
    return ok(result.created ? `Empresa "${name}" creada con su dueño.` : `Empresa "${name}" creada. El dueño ya tenía cuenta: entra con su contraseña de siempre.`, {
      email: result.email, password: result.password, created: result.created, org: orgId as string,
    })
  })
}

export async function updateCompanyAdmin(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const org = uuid(form, 'org')
    const plan = text(form, 'plan', 20)
    const status = text(form, 'status', 20)
    if (!isPlanId(plan) || !['activa', 'suspendida'].includes(status)) return fail('Revisa el plan y el estado.')
    const { error } = await (await db()).rpc('admin_update_org', { org, p_name: text(form, 'name', 120), p_plan: plan, p_status: status })
    if (error) return fail('No se pudo guardar (¿el panel sigue abierto?).')
    revalidatePath('/admin', 'layout')
    return ok('Empresa actualizada.')
  })
}

export async function adminAddMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const role = text(form, 'role', 10)
    if (!isRole(role)) return fail('Elige un rol.')
    const name = text(form, 'name', 80)
    if (name.length < 2) return fail('Escribe el nombre.')
    const result = await callAccounts<{ created: boolean; password: string | null; email: string }>('equipo_agregar', {
      org: uuid(form, 'org'), email: text(form, 'email', 160), name, role,
    })
    revalidatePath('/admin', 'layout')
    return ok(result.created ? 'Cuenta creada y sumada a la empresa.' : 'Sumada a la empresa: ya tenía cuenta.', {
      email: result.email, password: result.password, created: result.created,
    })
  })
}

export async function adminChangeRole(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const role = text(form, 'role', 10)
    if (!isRole(role)) return fail('Rol no válido.')
    await callAccounts('equipo_rol', { org: uuid(form, 'org'), user_id: uuid(form, 'user_id'), role })
    revalidatePath('/admin', 'layout')
    return ok('Rol actualizado.')
  })
}

export async function adminRemoveMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    await callAccounts('equipo_quitar', { org: uuid(form, 'org'), user_id: uuid(form, 'user_id') })
    revalidatePath('/admin', 'layout')
    return ok('Persona quitada de la empresa.')
  })
}

export async function adminResetPassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const result = await callAccounts<{ password: string; email: string }>('admin_restablecer', { user_id: uuid(form, 'user_id') })
    revalidatePath('/admin', 'layout')
    return ok('Contraseña temporal creada.', { email: result.email, password: result.password, created: true })
  })
}

export async function resolveRequest(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const decision = text(form, 'decision', 20)
    if (!['aprobada', 'rechazada', 'resuelta'].includes(decision)) return fail('Decisión no válida.')
    const { error } = await (await db()).rpc('admin_resolve_request', { req: uuid(form, 'id'), decision })
    if (error) return fail('No se pudo actualizar la solicitud (¿el panel sigue abierto?).')
    revalidatePath('/admin', 'layout')
    return ok(decision === 'aprobada' ? 'Solicitud aprobada.' : decision === 'rechazada' ? 'Solicitud rechazada.' : 'Marcada como resuelta.')
  })
}
