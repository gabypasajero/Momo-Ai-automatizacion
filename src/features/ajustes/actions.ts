'use server'

import { revalidatePath } from 'next/cache'
import { isPlanId } from '@/config/plans'
import { isRole } from '@/config/sales'
import { callAccounts } from '@/lib/accounts'
import { MANAGERS, attempt, fail, ok, optionalText, requireRole, text, uuid, type ActionState } from '@/lib/actions'

/** Nombre de la empresa y personas a las que Momo deriva (Área de Diseño, ventas…). */
export async function updateCompany(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(MANAGERS)
    const name = text(form, 'name', 120)
    if (name.length < 2) return fail('Escribe el nombre de la empresa.')
    const labels = form.getAll('contact_label').map((v) => String(v).trim().slice(0, 60))
    const phones = form.getAll('contact_phone').map((v) => String(v).trim().slice(0, 40))
    const contacts = labels.map((label, i) => ({ label, phone: phones[i] ?? '' })).filter((c) => c.label || c.phone)
    if (contacts.some((c) => !c.label || c.phone.replace(/\D/g, '').length < 8)) return fail('Cada contacto necesita un nombre y un teléfono completo.')
    const { error } = await session.db.from('organizations').update({ name, handoff_contacts: contacts }).eq('id', session.org.id)
    if (error) throw error
    revalidatePath('/', 'layout')
    return ok('Datos de la empresa guardados.')
  })
}

export async function addTeamMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(MANAGERS)
    const role = text(form, 'role', 10)
    if (!isRole(role)) return fail('Elige un rol.')
    const name = text(form, 'name', 80)
    if (name.length < 2) return fail('Escribe el nombre de la persona.')
    const result = await callAccounts<{ created: boolean; password: string | null; email: string }>('equipo_agregar', {
      org: session.org.id, email: text(form, 'email', 160), name, role,
    })
    revalidatePath('/ajustes')
    return ok(result.created ? 'Cuenta creada.' : 'Listo: ya tenía cuenta, entra con su contraseña de siempre.', {
      email: result.email, password: result.password, created: result.created,
    })
  })
}

export async function changeTeamRole(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(MANAGERS)
    const role = text(form, 'role', 10)
    if (!isRole(role)) return fail('Rol no válido.')
    await callAccounts('equipo_rol', { org: session.org.id, user_id: uuid(form, 'user_id'), role })
    revalidatePath('/ajustes')
    return ok('Rol actualizado.')
  })
}

export async function removeTeamMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(MANAGERS)
    await callAccounts('equipo_quitar', { org: session.org.id, user_id: uuid(form, 'user_id') })
    revalidatePath('/ajustes')
    return ok('La persona ya no es parte del equipo.')
  })
}

/** Solicitudes a Momo AI: cambio de plan, conexión de un canal o ayuda. Llegan al panel de administración. */
export async function sendRequest(_prev: ActionState, form: FormData): Promise<ActionState> {
  return attempt(async () => {
    const session = await requireRole(MANAGERS)
    const kind = text(form, 'kind', 10)
    const detail = text(form, 'detail', 120)
    if (!['plan', 'canal', 'soporte'].includes(kind) || !detail) return fail('Falta indicar qué necesitas.')
    if (kind === 'plan' && (!isPlanId(detail) || detail === session.org.plan)) return fail('Elige un plan distinto al actual.')
    const { data: pending } = await session.db.from('requests').select('id').eq('organization_id', session.org.id)
      .eq('kind', kind).eq('detail', detail).eq('status', 'pendiente').limit(1)
    if (pending?.length) return fail('Ya enviaste esta solicitud. Te avisaremos cuando esté lista.')
    const { error } = await session.db.from('requests').insert({
      organization_id: session.org.id, kind, detail, message: optionalText(form, 'message', 1000), created_by: session.user.id,
    })
    if (error) throw error
    revalidatePath('/ajustes')
    return ok('Solicitud enviada. Te contactaremos pronto.')
  })
}
